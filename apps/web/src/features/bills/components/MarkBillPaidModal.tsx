import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Calendar, CreditCard, Link2, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { Bill } from '../../../types';
import { formatINR } from '../utils/billFormatters';
import apiClient from '../../../services/apiClient';

interface MarkBillPaidModalProps {
  isOpen: boolean;
  bill: Bill | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface CandidateTransaction {
  id: string;
  amount: number;
  merchant?: string;
  paymentMethod?: string;
  occurredAt: string;
  type: string;
  expenseId?: string;
}

export const MarkBillPaidModal: React.FC<MarkBillPaidModalProps> = ({
  isOpen,
  bill,
  onClose,
  onSuccess,
}) => {
  const [paidDate, setPaidDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [candidateTxs, setCandidateTxs] = useState<CandidateTransaction[]>([]);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bill && isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setPaidDate(today);
      setPaymentMethod('UPI');
      setAmount(String(bill.amount));
      setNotes('');
      setSelectedTxId(null);
      setError('');

      // Fetch candidate debit transactions to provide deterministic smart matching
      fetchCandidateTransactions(bill);
    }
  }, [bill, isOpen]);

  const fetchCandidateTransactions = async (currentBill: Bill) => {
    try {
      setLoadingCandidates(true);
      const res = await apiClient.get('/transactions');
      const list = res.data?.transactions || [];

      // Filter DEBIT transactions within +/- 45 days
      const billDueDate = new Date(currentBill.dueDate).getTime();
      const debits = list.filter((t: CandidateTransaction) => {
        if (t.type !== 'DEBIT') return false;
        const txDate = new Date(t.occurredAt).getTime();
        const diffDays = Math.abs(txDate - billDueDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 45;
      });

      // Sort by best match: exact amount first, then by date proximity
      debits.sort((a: CandidateTransaction, b: CandidateTransaction) => {
        const aExact = Math.abs(a.amount - currentBill.amount) < 0.01;
        const bExact = Math.abs(b.amount - currentBill.amount) < 0.01;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
      });

      setCandidateTxs(debits.slice(0, 4));
    } catch (e) {
      console.warn('Could not fetch candidate transactions for matching:', e);
      setCandidateTxs([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  if (!isOpen || !bill) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload: any = {
        paidDate: new Date(paidDate).toISOString(),
        paymentMethod,
        amount: parseFloat(amount) || bill.amount,
        notes: notes.trim() || undefined,
      };

      if (selectedTxId) {
        payload.linkedTransactionId = selectedTxId;
      }

      await apiClient.put(`/bills/${bill.id}/pay`, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to mark bill as paid:', err);
      setError(err.response?.data?.error || 'Failed to record payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectCandidate = (tx: CandidateTransaction) => {
    if (selectedTxId === tx.id) {
      setSelectedTxId(null);
    } else {
      setSelectedTxId(tx.id);
      setAmount(String(tx.amount));
      if (tx.occurredAt) {
        setPaidDate(new Date(tx.occurredAt).toISOString().split('T')[0]);
      }
      if (tx.paymentMethod) {
        setPaymentMethod(tx.paymentMethod);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mark-paid-title"
    >
      <div className="bg-panel border border-primary/80 rounded-3xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-secondary hover:text-primary p-1.5 rounded-xl hover:bg-secondary/60 transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-primary/60 pb-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 id="mark-paid-title" className="font-extrabold text-base text-primary">
              Record Bill Payment
            </h3>
            <p className="text-xs text-secondary">
              Settling <span className="font-semibold text-primary">{bill.title}</span> ({formatINR(bill.amount)})
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Smart Matching Candidates (if any detected debits match) */}
        {candidateTxs.length > 0 && (
          <div className="p-3.5 bg-secondary/30 rounded-2xl border border-primary/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Detected Bank / UPI Transactions
              </span>
              <span className="text-[10px] text-muted">Smart Match</span>
            </div>

            <p className="text-[11px] text-secondary">
              Link an existing detected debit to avoid duplicate expenses:
            </p>

            <div className="space-y-1.5 pt-1">
              {candidateTxs.map((tx) => {
                const isSelected = selectedTxId === tx.id;
                const isExactAmount = Math.abs(tx.amount - bill.amount) < 0.01;

                return (
                  <div
                    key={tx.id}
                    onClick={() => handleSelectCandidate(tx)}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-primary shadow-xs'
                        : 'border-primary/60 bg-panel hover:border-primary text-secondary hover:text-primary'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-primary truncate">
                          {tx.merchant || 'Bank Debit'}
                        </span>
                        {isExactAmount && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex-shrink-0">
                            Exact Match
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted">
                        {new Date(tx.occurredAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        • {tx.paymentMethod || 'Debit'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-extrabold font-mono text-primary">
                        {formatINR(tx.amount)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-secondary/40 text-secondary border-primary/60'
                        }`}
                      >
                        {isSelected ? 'Linked' : 'Link'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedTxId && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Transaction linked: Zero duplicate expense will be created.</span>
              </p>
            )}
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            {/* Amount */}
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">
                Amount Paid (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3 py-2 text-xs font-mono font-bold text-primary focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Payment Date */}
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary font-medium focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="text-xs font-bold text-secondary block mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
              <option value="NET_BANKING">Net Banking / NEFT / IMPS</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="CASH">Cash</option>
              <option value="AUTO_DEBIT">Auto-Debit / NACH</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-secondary block mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Reference number, UPI Ref, receipt note"
              className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-primary hover:bg-secondary/40 border border-primary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
