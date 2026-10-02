import React, { useState, useEffect } from 'react';
import { X, Edit3, Tag, Calendar, IndianRupee } from 'lucide-react';
import { TransactionItem } from './TransactionRow';

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: TransactionItem | null;
  onClose: () => void;
  onSave: (id: string, updates: { merchant?: string; category?: string; amount?: number; occurredAt?: string }) => Promise<void>;
  availableCategories: string[];
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onSave,
  availableCategories,
}) => {
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (transaction) {
      setMerchant(
        transaction.merchant ||
        transaction.expense?.title ||
        transaction.income?.title ||
        ''
      );
      setAmount(String(transaction.amount || ''));
      setCategory(transaction.category || 'Other');
      setDate(
        transaction.occurredAt
          ? new Date(transaction.occurredAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
    }
    setError('');
  }, [transaction, isOpen]);

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant.trim()) {
      setError('Please provide a merchant or transaction title.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave(transaction.id, {
        merchant: merchant.trim(),
        amount: numAmount,
        category: category.trim() || 'Other',
        occurredAt: new Date(date).toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to update transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-panel border border-primary/80 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 border-b border-primary/40 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-md">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-primary">Edit Transaction Details</h3>
            <p className="text-xs text-secondary">
              Update amount, category or merchant information
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount input */}
          <div>
            <label className="text-xs font-bold text-secondary block mb-1.5">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-muted text-base">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-base font-black font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Merchant / Title */}
          <div>
            <label className="text-xs font-bold text-secondary block mb-1.5">Merchant / Title</label>
            <input
              type="text"
              required
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Swiggy, DMart, Salary"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Category */}
            <div>
              <label className="text-xs font-bold text-secondary block mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 appearance-none bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c} className="bg-panel text-primary">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-bold text-secondary block mb-1.5">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-primary/20">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold rounded-xl border border-primary/30 text-secondary hover:text-primary hover:bg-surface-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/25 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
