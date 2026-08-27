import React, { useState } from 'react';
import { X, Wallet, DollarSign, Calendar, Tag, FileText, Sparkles, Check } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useSettingStore } from '../../stores/useSettingStore';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INCOME_SOURCES = [
  { label: 'Salary', icon: '💼' },
  { label: 'Freelance', icon: '💻' },
  { label: 'Business', icon: '🏢' },
  { label: 'Investments', icon: '📈' },
  { label: 'Rental', icon: '🏠' },
  { label: 'Dividends', icon: '🪙' },
  { label: 'Gift / Allowance', icon: '🎁' },
  { label: 'Other', icon: '💵' },
];

export const AddIncomeModal: React.FC<AddIncomeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Salary');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { currencySymbol } = useSettingStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) {
      setError('Please fill in title and amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.post('/income', {
        title,
        amount: parseFloat(amount),
        source,
        date: new Date(date).toISOString(),
        description,
      });

      setTitle('');
      setAmount('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add income');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-panel border border-primary/80 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-primary">Add Income Record</h3>
              <p className="text-[11px] text-secondary">Log salary, freelance, or earnings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-secondary hover:text-primary hover:bg-secondary/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Income Title */}
          <div>
            <label className="text-xs font-bold text-secondary block mb-1.5">Income Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly Salary, Freelance Project"
              className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-secondary block mb-1.5">
                Amount ({currencySymbol})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-secondary/60 border border-primary/80 rounded-xl pl-8 pr-3 py-2.5 text-xs text-primary font-mono font-bold focus:outline-none focus:border-emerald-500"
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
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Income Source / Category */}
          <div>
            <label className="text-xs font-bold text-secondary block mb-1.5">Income Source</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INCOME_SOURCES.map((s) => (
                <button
                  type="button"
                  key={s.label}
                  onClick={() => setSource(s.label)}
                  className={`p-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                    source === s.label
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-300 shadow-xs'
                      : 'bg-secondary/40 border-primary/60 text-secondary hover:bg-secondary/70'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="text-xs font-bold text-secondary block mb-1.5">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details, invoice number, etc."
              className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2 text-xs text-primary placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-primary/80 text-xs font-bold text-secondary hover:bg-secondary/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Save Income</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIncomeModal;
