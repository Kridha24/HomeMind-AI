import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  EyeOff,
  Sparkles,
  Tag,
  Building,
  Check,
  X
} from 'lucide-react';
import { StoredTransaction } from '../../services/sms/types';
import { useSettingStore } from '../../stores/useSettingStore';
import { TransactionCategorizer } from '../../services/sms/transactionCategorizer';

interface Props {
  transaction: StoredTransaction;
  onConfirm?: (tx: StoredTransaction) => void;
  onUpdate?: (tx: StoredTransaction, updates: { merchant?: string; category?: string; status?: string }) => void;
  onDelete?: (tx: StoredTransaction) => void;
  onIgnore?: (tx: StoredTransaction) => void;
}

const CATEGORY_OPTIONS = [
  'Food',
  'Groceries',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Healthcare',
  'Household',
  'Education',
  'Cash Withdrawal',
  'Salary',
  'Investment',
  'Income',
  'Other'
];

export const DetectedTransactionCard: React.FC<Props> = ({
  transaction,
  onConfirm,
  onUpdate,
  onDelete,
  onIgnore
}) => {
  const { format } = useSettingStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editMerchant, setEditMerchant] = useState(transaction.merchant || '');
  const [editCategory, setEditCategory] = useState(transaction.category || 'Other');
  const [rememberPreference, setRememberPreference] = useState(true);

  const isConfirmed = transaction.status === 'CONFIRMED';
  const isNeedsReview = transaction.status === 'NEEDS_REVIEW';
  const isDebit = transaction.type === 'DEBIT';

  const handleSaveEdit = () => {
    if (rememberPreference && editMerchant.trim()) {
      TransactionCategorizer.saveUserMapping(editMerchant, editCategory);
    }
    if (onUpdate) {
      onUpdate(transaction, {
        merchant: editMerchant.trim() || undefined,
        category: editCategory,
        status: isNeedsReview ? 'CONFIRMED' : transaction.status
      });
    }
    setIsEditing(false);
  };

  const formattedDate = new Date(transaction.occurredAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      className={`glass-panel p-4 sm:p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
        isNeedsReview
          ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/15'
          : 'border-primary/15 hover:border-primary/30'
      }`}
    >
      {/* Top Banner for Needs Review */}
      {isNeedsReview && (
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 mb-3 bg-amber-500/10 px-3 py-1.5 rounded-xl w-fit">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Transaction Needs Review ({Math.round(transaction.parserConfidence * 100)}% confidence)</span>
        </div>
      )}

      {/* Main Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Merchant & Details */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              isDebit
                ? 'bg-red-500/10 border-red-500/20 text-red-500'
                : 'bg-green-500/10 border-green-500/20 text-green-500'
            }`}
          >
            <CreditCard className="w-5 h-5" />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-primary text-base truncate">
                {transaction.merchant || transaction.bankName || 'Direct Transaction'}
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-elevated text-secondary border border-primary/10">
                {transaction.category || 'Other'}
              </span>
              {isConfirmed && (
                <span className="text-[10px] font-semibold text-blue-500 flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> Auto-detected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-secondary flex-wrap">
              {transaction.paymentMethod && (
                <span className="font-medium text-primary">{transaction.paymentMethod}</span>
              )}
              {transaction.bankName && (
                <>
                  <span>•</span>
                  <span>{transaction.bankName}</span>
                </>
              )}
              {transaction.accountLast4 && (
                <>
                  <span>•</span>
                  <span className="font-mono">XX{transaction.accountLast4}</span>
                </>
              )}
              <span>•</span>
              <span>{formattedDate}</span>
            </div>

            {transaction.reference && (
              <p className="text-[11px] text-muted font-mono truncate">
                Ref: {transaction.reference}
              </p>
            )}
          </div>
        </div>

        {/* Right Side: Amount & Actions */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
          <div
            className={`text-lg sm:text-xl font-extrabold font-mono ${
              isDebit ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {isDebit ? '-' : '+'}
            {format(transaction.amount)}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {isNeedsReview && onConfirm && (
              <button
                type="button"
                onClick={() => onConfirm(transaction)}
                className="flex items-center gap-1 text-xs font-bold text-white bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-xl shadow-sm active:scale-95 transition-all"
                title="Confirm and log to expenses"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-xl border border-primary/10 text-secondary hover:text-primary hover:bg-surface-elevated transition-colors"
              title="Edit details"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {isNeedsReview && onIgnore && (
              <button
                type="button"
                onClick={() => onIgnore(transaction)}
                className="p-1.5 rounded-xl border border-primary/10 text-secondary hover:text-amber-500 hover:bg-surface-elevated transition-colors"
                title="Ignore transaction"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(transaction)}
                className="p-1.5 rounded-xl border border-primary/10 text-secondary hover:text-red-500 hover:bg-surface-elevated transition-colors"
                title="Delete transaction"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inline Edit Modal / Drawer */}
      {isEditing && (
        <div className="mt-4 pt-4 border-t border-primary/15 space-y-3 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">
                Merchant / Payee Name
              </label>
              <input
                type="text"
                value={editMerchant}
                onChange={(e) => setEditMerchant(e.target.value)}
                placeholder="e.g. Zomato, Amazon, Uber"
                className="w-full text-xs px-3 py-2 rounded-xl bg-surface-elevated border border-primary/20 text-primary focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">
                Category
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl bg-surface-elevated border border-primary/20 text-primary focus:outline-none focus:border-blue-500"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <label className="flex items-center gap-2 text-xs text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberPreference}
                onChange={(e) => setRememberPreference(e.target.checked)}
                className="rounded border-primary/30 text-blue-600 focus:ring-blue-500"
              />
              <span>Remember category for {editMerchant || 'this merchant'}</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-secondary hover:text-primary px-3 py-1.5 rounded-xl border border-primary/20"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-xl shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
