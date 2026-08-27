import React, { useState } from 'react';
import { X, CreditCard, Plus, RefreshCw, Calendar, Tag, DollarSign, Receipt, Sparkles } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useSettingStore } from '../../stores/useSettingStore';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  'Groceries',
  'Utilities',
  'Dining & Food',
  'Home & Maintenance',
  'Health & Medicine',
  'Shopping',
  'Entertainment',
  'Transport',
  'Subscriptions',
  'Education',
  'Other',
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { currencySymbol } = useSettingStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) {
      setError('Please enter expense title and amount.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.post('/expenses', {
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date,
        notes: notes.trim() || undefined,
      });

      setTitle('');
      setAmount('');
      setCategory('Groceries');
      setNotes('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to log expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-panel border border-primary rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-primary p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-primary tracking-tight">Log Household Expense</h2>
            <p className="text-xs text-muted">Add a quick transaction to your household ledger</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-secondary block mb-1.5">Expense Title / Item</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Supermarket Groceries, Internet Bill"
              className="w-full bg-background border border-primary rounded-xl px-4 py-3 text-sm text-primary placeholder-slate-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1.5">
                Amount ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-bold text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-background border border-primary rounded-xl pl-9 pr-4 py-3 text-sm font-semibold text-primary placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-secondary block mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-background border border-primary rounded-xl px-4 py-3 text-sm text-primary focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-secondary block mb-1.5">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-background border border-primary rounded-xl px-4 py-3 text-sm text-primary focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-secondary block mb-1.5">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid via Google Pay, Split with roommate"
              className="w-full bg-background border border-primary rounded-xl px-4 py-2.5 text-sm text-primary placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim() || !amount}
            className="w-full min-h-[46px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Log Expense</span>
          </button>
        </form>
      </div>
    </div>
  );
};
