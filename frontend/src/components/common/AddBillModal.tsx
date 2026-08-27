import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, DollarSign, Tag, Building, Edit3, Sparkles, Check } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useSettingStore } from '../../stores/useSettingStore';

interface AddBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export const AddBillModal: React.FC<AddBillModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Electricity');
  const [dueDate, setDueDate] = useState('');
  const [provider, setProvider] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { currencySymbol } = useSettingStore();

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setCategory(initialData.category || 'Electricity');
      if (initialData.dueDate) {
        setDueDate(new Date(initialData.dueDate).toISOString().split('T')[0]);
      }
      setProvider(initialData.provider || '');
      setNotes(initialData.notes || '');
    } else {
      setTitle('');
      setAmount('');
      setCategory('Electricity');
      setDueDate('');
      setProvider('');
      setNotes('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !dueDate) return;
    setLoading(true);
    setError('');

    try {
      if (initialData?.id) {
        // Edit existing bill
        await apiClient.put(`/bills/${initialData.id}`, {
          title,
          amount: parseFloat(amount),
          category,
          dueDate: new Date(dueDate).toISOString(),
          provider,
          notes,
        });
      } else {
        // Create new bill
        await apiClient.post('/bills', {
          title,
          amount: parseFloat(amount),
          category,
          dueDate: new Date(dueDate).toISOString(),
          provider,
          notes,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save bill record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-panel border border-primary/80 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-secondary hover:text-primary p-1.5 rounded-xl hover:bg-secondary/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-primary/60 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            {initialData ? <Edit3 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-extrabold text-base text-primary">
              {initialData ? 'Edit Utility Bill' : 'Add Utility Bill'}
            </h3>
            <p className="text-xs text-secondary">
              {initialData ? 'Update due date, amount or provider' : 'Track rent, electricity, Wi-Fi or water fees'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-secondary block mb-1">Bill Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Room Rent, Wi-Fi Bill, Electricity"
              className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">
                Amount ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3 py-2.5 text-xs text-primary focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="Rent">Rent</option>
                <option value="Electricity">Electricity</option>
                <option value="Water">Water</option>
                <option value="Internet">Internet / Wi-Fi</option>
                <option value="Gas">Gas</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Provider (Optional)</label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. Landlord, Airtel"
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2 text-xs text-primary focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-secondary block mb-1">Notes / Instructions</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Account number or reminder instructions"
              className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2 text-xs text-primary focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/25 active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{initialData ? 'Update Bill' : 'Save Bill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBillModal;
