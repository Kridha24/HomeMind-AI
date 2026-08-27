import React, { useState, useEffect } from 'react';
import { X, CreditCard, Plus, RefreshCw, Calendar, Tag, DollarSign, Receipt, Sparkles, Edit3, Check } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useSettingStore } from '../../stores/useSettingStore';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: any;
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
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { currencySymbol } = useSettingStore();

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setCategory(initialData.category || 'Groceries');
      if (initialData.date) {
        setDate(new Date(initialData.date).toISOString().split('T')[0]);
      }
      setNotes(initialData.notes || '');
    } else {
      setTitle('');
      setAmount('');
      setCategory('Groceries');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
    setError('');
  }, [initialData, isOpen]);

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
      if (initialData?.id) {
        // Edit existing expense
        await apiClient.put(`/expenses/${initialData.id}`, {
          title: title.trim(),
          amount: parseFloat(amount),
          category,
          date: new Date(date).toISOString(),
          notes: notes.trim() || undefined,
        });
      } else {
        // Create new expense
        await apiClient.post('/expenses', {
          title: title.trim(),
          amount: parseFloat(amount),
          category,
          date: new Date(date).toISOString(),
          notes: notes.trim() || undefined,
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-panel border border-primary/80 rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90dvh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary p-2 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 border-b border-primary/60 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-md">
            {initialData ? <Edit3 className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-primary">
              {initialData ? 'Edit Expense Record' : 'Add Expense'}
            </h3>
            <p className="text-xs text-secondary">
              {initialData ? 'Update amount, category or date' : 'Log a new payment into the ledger'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-secondary block mb-1.5">Expense Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Supermarket Run, Uber Ride"
              className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-4 py-2.5 text-xs text-primary focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-secondary block mb-1.5">
                Amount ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-secondary/60 border border-primary/80 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-primary font-mono font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1.5">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-secondary block mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-blue-500 font-medium"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-secondary block mb-1.5">Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details, item list or tags"
              className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-4 py-2.5 text-xs text-primary focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-primary/80 text-xs font-bold text-secondary hover:bg-secondary/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/25 active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{initialData ? 'Update Expense' : 'Save Expense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
