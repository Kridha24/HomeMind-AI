import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Wallet,
  Calendar,
  Tag,
  Building2,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Edit3,
  Trash2,
  CheckCircle2,
  EyeOff,
  Copy,
  Check,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';
import { TransactionItem } from './TransactionRow';
import { CategoryBadge } from './CategoryBadge';
import { TransactionSourceBadge } from './TransactionSourceBadge';
import { formatINR, formatFinanceTimestamp } from '../utils/financeFormatters';

interface TransactionDetailDrawerProps {
  transaction: TransactionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (tx: TransactionItem) => void;
  onDelete: (tx: TransactionItem) => void;
  onConfirm?: (tx: TransactionItem) => void;
  onIgnore?: (tx: TransactionItem) => void;
  onChangeCategory?: (tx: TransactionItem, newCategory: string) => void;
  timeZone?: string;
  reducedMotion?: boolean;
}

const COMMON_CATEGORIES = [
  'Groceries',
  'Dining & Food',
  'Utilities',
  'Shopping',
  'Transport',
  'Home & Maintenance',
  'Health & Medicine',
  'Entertainment',
  'Subscriptions',
  'Salary',
  'Freelance',
  'Other',
];

export const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  transaction,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onConfirm,
  onIgnore,
  onChangeCategory,
  timeZone,
  reducedMotion = false,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);
  const [isChangingCat, setIsChangingCat] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !transaction) return null;

  const isDebit = transaction.type === 'DEBIT';
  const isNeedsReview = transaction.status === 'NEEDS_REVIEW';
  const displayTitle =
    transaction.merchant ||
    transaction.expense?.title ||
    transaction.income?.title ||
    (isDebit ? 'Expense' : 'Income');

  const handleCopyReference = () => {
    if (!transaction.reference) return;
    navigator.clipboard.writeText(transaction.reference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const animationClass = reducedMotion
    ? ''
    : 'transition-transform duration-200 ease-out transform-gpu';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-sm flex justify-end">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Panel */}
      <div
        className={`relative z-10 w-full max-w-md bg-panel border-l border-primary/60 shadow-2xl flex flex-col h-full overflow-hidden ${animationClass}`}
      >
        {/* Header Strip */}
        <div className="p-5 border-b border-primary/30 flex items-center justify-between bg-surface-elevated/40">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                isDebit
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isDebit ? 'Debit / Outlay' : 'Credit / Deposit'}
            </span>
            <span className="text-xs font-mono text-muted">ID: {transaction.id.slice(0, 8)}...</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-elevated hover:bg-secondary text-secondary hover:text-primary flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Large Amount Display */}
          <div className="text-center py-4 rounded-3xl bg-surface-elevated/40 border border-primary/30 shadow-inner">
            <span
              className={`text-3xl sm:text-4xl font-black font-mono tracking-tight block ${
                isDebit ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isDebit ? `-${formatINR(transaction.amount)}` : `+${formatINR(transaction.amount)}`}
            </span>
            <span className="text-xs font-bold text-primary mt-1 block">
              {displayTitle}
            </span>
            <span className="text-[11px] text-muted block mt-0.5 font-mono">
              {formatFinanceTimestamp(transaction.occurredAt, timeZone)}
            </span>
          </div>

          {/* Needs Review Alert Banner */}
          {isNeedsReview && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-extrabold text-amber-700 dark:text-amber-400 block">
                  Automatic Detection Requires Review
                </span>
                <span className="text-muted block mt-0.5">
                  Confirm this transaction to finalize the category and link to household aggregates.
                </span>
              </div>
            </div>
          )}

          {/* Core Properties Matrix */}
          <div className="glass-panel p-4 rounded-2xl border-primary/40 space-y-3.5 text-xs">
            {/* Category with quick changer */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-secondary flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-500" /> Category
              </span>
              <div className="flex items-center gap-2">
                <CategoryBadge category={transaction.category} />
                <button
                  type="button"
                  onClick={() => setIsChangingCat(!isChangingCat)}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Inline Category Changer Picker */}
            {isChangingCat && (
              <div className="p-2.5 rounded-xl bg-surface-elevated border border-primary/30 flex flex-wrap gap-1.5 animate-in fade-in duration-150">
                {COMMON_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      onChangeCategory?.(transaction, cat);
                      setIsChangingCat(false);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      transaction.category === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-primary/10 text-secondary hover:text-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Source */}
            <div className="flex items-center justify-between border-t border-primary/15 pt-3">
              <span className="font-semibold text-secondary flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" /> Ingestion Source
              </span>
              <TransactionSourceBadge
                source={transaction.source}
                paymentMethod={transaction.paymentMethod}
                bankName={transaction.bankName}
                isAiCategorized={Boolean(transaction.parserConfidence && transaction.parserConfidence > 0.8)}
              />
            </div>

            {/* Bank / Provider */}
            {transaction.bankName && (
              <div className="flex items-center justify-between border-t border-primary/15 pt-3">
                <span className="font-semibold text-secondary flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" /> Bank / Provider
                </span>
                <span className="font-bold text-primary font-mono">{transaction.bankName}</span>
              </div>
            )}

            {/* Masked Account */}
            {transaction.accountLast4 && (
              <div className="flex items-center justify-between border-t border-primary/15 pt-3">
                <span className="font-semibold text-secondary flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Masked Account
                </span>
                <span className="font-bold text-primary font-mono">•• {transaction.accountLast4}</span>
              </div>
            )}

            {/* Reference ID */}
            {transaction.reference && (
              <div className="flex items-center justify-between border-t border-primary/15 pt-3">
                <span className="font-semibold text-secondary flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-500" /> Reference / UTR
                </span>
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-primary">
                  <span>{transaction.reference}</span>
                  <button
                    type="button"
                    onClick={handleCopyReference}
                    className="p-1 text-muted hover:text-primary transition-colors"
                    title="Copy reference ID"
                  >
                    {copiedRef ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confidence Score */}
            {transaction.parserConfidence && (
              <div className="flex items-center justify-between border-t border-primary/15 pt-3">
                <span className="font-semibold text-secondary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-500" /> Detection Accuracy
                </span>
                <span className="font-bold font-mono text-violet-600 dark:text-violet-400">
                  {Math.round(transaction.parserConfidence * 100)}% Confidence
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-primary/30 bg-surface-elevated/40 space-y-2.5">
          {/* Needs Review Confirmation Buttons */}
          {isNeedsReview && onConfirm && onIgnore && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onConfirm(transaction)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Transaction</span>
              </button>
              <button
                type="button"
                onClick={() => onIgnore(transaction)}
                className="px-3 py-2.5 bg-surface-elevated hover:bg-secondary text-secondary hover:text-primary font-bold text-xs rounded-xl border border-primary/20 transition-all flex items-center gap-1"
                title="Ignore this transaction"
              >
                <EyeOff className="w-4 h-4" />
                <span>Ignore</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(transaction)}
              className="flex-1 py-2.5 bg-surface-elevated hover:bg-secondary border border-primary/30 text-primary font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-500" />
              <span>Edit Details</span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(transaction)}
              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
