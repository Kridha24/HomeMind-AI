import React, { useState } from 'react';
import { X, Play, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Database, Terminal } from 'lucide-react';
import { BankSmsParser } from '../../services/sms/bankSmsParser';
import { ParsedSmsTransaction } from '../../services/sms/types';
import { SmsSyncManager } from '../../services/sms/smsSyncManager';
import { TransactionCategorizer } from '../../services/sms/transactionCategorizer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTransactionImported?: () => void;
}

const SAMPLE_TEMPLATES = [
  {
    name: 'UPI Debit (Zomato)',
    sender: 'HDFCBK',
    body: 'Rs.450.00 debited from A/c XX1234 via UPI to ZOMATO@UPI. Ref No 638291827261.'
  },
  {
    name: 'Bank Debit (Amazon)',
    sender: 'HDFCBK',
    body: 'Dear Customer, Your A/c ending 5678 is debited for INR 1,299.00 on 01-Oct-26 at AMAZON INDIA. Avail Bal: Rs 15,400.00 - HDFC Bank'
  },
  {
    name: 'NEFT Credit (Salary)',
    sender: 'SBIINB',
    body: 'INR 45,000 credited to A/c XX8821 through NEFT. Ref No SALOCT2026.'
  },
  {
    name: 'ATM Cash Withdrawal',
    sender: 'ICICIB',
    body: 'Acct XX1122 debited with INR 5,000.00 on 01-10-26 at ATM WDL. Avl Bal INR 12,000'
  },
  {
    name: 'UPI Credit (Refund)',
    sender: 'AXISBK',
    body: 'Refund of Rs. 350.00 for order 9876 credited to your A/C XX1234 on 01-10-26 by UPI ref 492819283741'
  },
  {
    name: 'OTP Message (Should be Rejected)',
    sender: 'HDFCBK',
    body: 'Your OTP is 839291 for login to NetBanking. Do not share it with anyone.'
  }
];

export const SmsDebugModal: React.FC<Props> = ({ isOpen, onClose, onTransactionImported }) => {
  const [smsSender, setSmsSender] = useState('HDFCBK');
  const [smsBody, setSmsBody] = useState(SAMPLE_TEMPLATES[0].body);
  const [parsedResult, setParsedResult] = useState<ParsedSmsTransaction | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = async () => {
    setParseError(null);
    setImportSuccess(null);
    try {
      const parsed = await BankSmsParser.parse(smsSender, smsBody);
      if (parsed) {
        // Auto-assign category
        parsed.category = TransactionCategorizer.categorize(
          parsed.merchant,
          parsed.paymentMethod,
          parsed.type
        );
        setParsedResult(parsed);
      } else {
        setParsedResult(null);
        setParseError('Message rejected: Not recognized as a valid financial transaction or contains OTP/promotional keywords.');
      }
    } catch (e: any) {
      setParsedResult(null);
      setParseError(e.message || 'Failed to parse SMS');
    }
  };

  const handleSimulateImport = async () => {
    if (!parsedResult) return;
    setImporting(true);
    setImportSuccess(null);
    try {
      const res = await SmsSyncManager.importSingleTransaction(parsedResult);
      if (res.duplicate) {
        setImportSuccess('Notice: This exact transaction was detected as a duplicate (already in database)!');
      } else {
        setImportSuccess(`Successfully imported ${parsedResult.type} ₹${parsedResult.amount} into HomeMind database!`);
        if (onTransactionImported) {
          onTransactionImported();
        }
      }
    } catch (err: any) {
      setParseError(err.response?.data?.error || err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const loadTemplate = (tmpl: typeof SAMPLE_TEMPLATES[0]) => {
    setSmsSender(tmpl.sender);
    setSmsBody(tmpl.body);
    setParsedResult(null);
    setParseError(null);
    setImportSuccess(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-surface border border-primary/20 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-2">
                Bank SMS Parser Debugger
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  Dev Only
                </span>
              </h3>
              <p className="text-xs text-secondary">
                Test parsing rules & test import live transactions without physical SMS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-secondary hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-elevated"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Sample Templates */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-secondary block">
            Load Quick Sample Format:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => loadTemplate(tmpl)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-surface-elevated border border-primary/15 text-secondary hover:text-primary hover:border-blue-500/40 transition-all"
              >
                {tmpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sender and Body Input */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-secondary block mb-1">
              Sender Header (e.g. HDFCBK, SBIINB, AXISBK, VM-KOTAKB)
            </label>
            <input
              type="text"
              value={smsSender}
              onChange={(e) => setSmsSender(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-surface-elevated border border-primary/20 text-primary font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-secondary block mb-1">
              Bank / UPI SMS Body Text
            </label>
            <textarea
              rows={3}
              value={smsBody}
              onChange={(e) => setSmsBody(e.target.value)}
              placeholder="Paste raw SMS text here..."
              className="w-full text-xs p-3 rounded-xl bg-surface-elevated border border-primary/20 text-primary font-mono focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleParse}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition-all active:scale-[0.99]"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Parse Transaction</span>
          </button>
        </div>

        {/* Error Output */}
        {parseError && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Success Output */}
        {importSuccess && (
          <div className="p-3.5 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{importSuccess}</span>
          </div>
        )}

        {/* Parsed Result Display */}
        {parsedResult && (
          <div className="p-4 rounded-2xl bg-surface-elevated border border-primary/20 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-primary/10 pb-2">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Parsed Result
              </span>
              <span className="text-xs font-mono font-bold text-green-500">
                Confidence: {Math.round(parsedResult.parserConfidence * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-secondary block text-[10px]">Amount</span>
                <span className="font-extrabold font-mono text-primary text-sm">
                  {parsedResult.type === 'DEBIT' ? '-' : '+'}₹{parsedResult.amount}
                </span>
              </div>

              <div>
                <span className="text-secondary block text-[10px]">Type</span>
                <span
                  className={`font-bold ${
                    parsedResult.type === 'DEBIT' ? 'text-red-500' : 'text-green-500'
                  }`}
                >
                  {parsedResult.type}
                </span>
              </div>

              <div>
                <span className="text-secondary block text-[10px]">Merchant</span>
                <span className="font-bold text-primary">
                  {parsedResult.merchant || 'None detected'}
                </span>
              </div>

              <div>
                <span className="text-secondary block text-[10px]">Category</span>
                <span className="font-bold text-blue-500">
                  {parsedResult.category || 'Other'}
                </span>
              </div>

              <div>
                <span className="text-secondary block text-[10px]">Method</span>
                <span className="font-bold text-primary">
                  {parsedResult.paymentMethod || 'BANK'}
                </span>
              </div>

              <div>
                <span className="text-secondary block text-[10px]">Account</span>
                <span className="font-mono text-primary">
                  {parsedResult.accountLast4 ? `XX${parsedResult.accountLast4}` : 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-secondary block text-[10px]">Bank</span>
                <span className="text-primary font-medium">
                  {parsedResult.bankName || 'Unknown'}
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-secondary block text-[10px]">Reference</span>
                <span className="font-mono text-primary truncate block">
                  {parsedResult.reference || 'None'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-primary/10 flex justify-end">
              <button
                type="button"
                disabled={importing}
                onClick={handleSimulateImport}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md active:scale-95 transition-all"
              >
                {importing ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Database className="w-3.5 h-3.5" />
                )}
                <span>Simulate & Import to Database</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
