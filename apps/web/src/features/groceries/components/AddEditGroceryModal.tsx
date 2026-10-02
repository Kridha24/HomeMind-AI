import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Edit3, Calendar } from 'lucide-react';
import { GroceryItem } from '../../../types';
import { GROCERY_CATEGORIES, GROCERY_UNITS } from '../utils/groceryFormatters';

interface AddEditGroceryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<GroceryItem>) => Promise<void>;
  initialData?: GroceryItem | null;
}

export const AddEditGroceryModal: React.FC<AddEditGroceryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Vegetables');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pcs');
  const [minThreshold, setMinThreshold] = useState('1');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCategory(initialData.category || 'Vegetables');
      setQuantity(initialData.quantity !== undefined ? String(initialData.quantity) : '1');
      setUnit(initialData.unit || 'pcs');
      setMinThreshold(initialData.minThreshold !== undefined ? String(initialData.minThreshold) : '1');
      if (initialData.expiryDate) {
        setExpiryDate(new Date(initialData.expiryDate).toISOString().split('T')[0]);
      } else {
        setExpiryDate('');
      }
    } else {
      setName('');
      setCategory('Vegetables');
      setQuantity('1');
      setUnit('pcs');
      setMinThreshold('1');
      setExpiryDate('');
    }
    setError('');
  }, [initialData, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Item name is required');
      return;
    }

    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Please enter a valid quantity greater than 0');
      return;
    }

    const parsedThreshold = parseFloat(minThreshold);
    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      setError('Please enter a valid threshold (0 or more)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubmit({
        name: trimmed,
        category,
        quantity: parsedQty,
        unit,
        minThreshold: parsedThreshold,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to save grocery item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-primary/80 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="grocery-modal-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-secondary hover:text-primary p-2 rounded-xl hover:bg-secondary/60 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-primary/60 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            {initialData ? <Edit3 className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
          </div>
          <div>
            <h3 id="grocery-modal-title" className="font-extrabold text-base text-primary">
              {initialData ? 'Edit Grocery Item' : 'Add Grocery Item'}
            </h3>
            <p className="text-xs text-secondary">
              {initialData
                ? 'Update household stock details, shelf life, or thresholds'
                : 'Add a new grocery or pantry item to your household list'}
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <div>
            <label className="text-xs font-bold text-secondary block mb-1">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fresh Milk, Tomatoes, Sourdough Bread"
              className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
              >
                {GROCERY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
              >
                {GROCERY_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity & Min Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                placeholder="1"
                className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500 font-medium"
              />
              <span className="text-[10px] text-muted mt-0.5 block">
                Triggers warning when quantity drops to this level
              </span>
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="text-xs font-bold text-secondary block mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-secondary" />
              <span>Expiry Date (Optional)</span>
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full bg-secondary/50 dark:bg-slate-900/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-primary/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-primary/80 text-xs font-bold text-secondary hover:text-primary hover:bg-secondary/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{initialData ? 'Save Changes' : 'Add Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
