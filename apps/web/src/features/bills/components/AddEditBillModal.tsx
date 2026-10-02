import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, Tag, Building, Edit3, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Bill } from '../../../types';
import apiClient from '../../../services/apiClient';

interface AddEditBillModalProps {
  isOpen: boolean;
  initialBill?: Bill | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddEditBillModal: React.FC<AddEditBillModalProps> = ({
  isOpen,
  initialBill,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Rent');
  const [dueDate, setDueDate] = useState('');
  const [provider, setProvider] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialBill && isOpen) {
      setTitle(initialBill.title || '');
      setAmount(String(initialBill.amount || ''));
      setCategory(initialBill.category || 'Rent');
      if (initialBill.dueDate) {
        setDueDate(new Date(initialBill.dueDate).toISOString().split('T')[0]);
      }
      setProvider(initialBill.provider || '');
      setNotes(initialBill.notes || '');
    } else if (isOpen) {
      setTitle('');
      setAmount('');
      setCategory('Rent');
      // Default due date: 7 days from now
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDueDate(d.toISOString().split('T')[0]);
      setProvider('');
      setNotes('');
    }
    setError('');
  }, [initialBill, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount || !dueDate) {
      setError('Please fill in title, amount, and due date.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please provide a valid positive amount.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (initialBill?.id) {
        await apiClient.put(`/bills/${initialBill.id}`, {
          title: title.trim(),
          amount: numAmount,
          category,
          dueDate: new Date(dueDate).toISOString(),
          provider: provider.trim() || null,
          notes: notes.trim() || null,
        });
      } else {
        await apiClient.post('/bills', {
          title: title.trim(),
          amount: numAmount,
          category,
          dueDate: new Date(dueDate).toISOString(),
          provider: provider.trim() || null,
          notes: notes.trim() || null,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save bill:', err);
      setError(err.response?.data?.error || 'Failed to save bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = Boolean(initialBill?.id);

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-edit-bill-title"
    >
      <div className="bg-panel border border-primary/80 rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-secondary hover:text-primary p-1.5 rounded-xl hover:bg-secondary/60 transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-primary/60 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            {isEditing ? <Edit3 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <h3 id="add-edit-bill-title" className="font-extrabold text-base text-primary">
              {isEditing ? 'Edit Bill Details' : 'Add New Bill'}
            </h3>
            <p className="text-xs text-secondary">
              {isEditing
                ? 'Update schedule, expected amount, or notes'
                : 'Track rent, electricity, Wi-Fi or subscription due dates'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Bill Title */}
          <div>
            <label className="text-xs font-bold text-secondary block mb-1">
              Bill Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. PG Rent, Broadband, City Electricity"
              className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary font-medium focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">
                Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-secondary">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="4000"
                  className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-primary focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="Rent">Rent</option>
                <option value="Electricity">Electricity</option>
                <option value="Water">Water</option>
                <option value="Internet">Internet / Wi-Fi</option>
                <option value="Gas">Gas</option>
                <option value="Phone">Phone / Mobile</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Subscription">Subscription</option>
                <option value="Insurance">Insurance</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Due Date & Provider */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">
                Provider / Landlord (Optional)
              </label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. Landlord, Airtel"
                className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary font-medium focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-secondary block mb-1">
              Notes / Instructions
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Due 5th of every month, account number"
              className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary font-medium focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-secondary hover:text-primary hover:bg-secondary/40 border border-primary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Update Bill' : 'Save Bill'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
