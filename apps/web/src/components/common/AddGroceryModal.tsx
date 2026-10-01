import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Edit3, Sparkles, Check } from 'lucide-react';
import apiClient from '../../services/apiClient';

interface AddGroceryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: any;
}

export const AddGroceryModal: React.FC<AddGroceryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Vegetables');
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
      setQuantity(initialData.quantity ? String(initialData.quantity) : '1');
      setUnit(initialData.unit || 'pcs');
      setMinThreshold(initialData.minThreshold ? String(initialData.minThreshold) : '1');
      if (initialData.expiryDate) {
        setExpiryDate(new Date(initialData.expiryDate).toISOString().split('T')[0]);
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity) return;
    setLoading(true);
    setError('');

    try {
      if (initialData?.id) {
        // Edit existing grocery item
        await apiClient.put(`/inventory/${initialData.id}`, {
          name,
          category,
          quantity: parseFloat(quantity),
          unit,
          minThreshold: parseFloat(minThreshold),
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        });
      } else {
        // Create new grocery item
        await apiClient.post('/inventory', {
          name,
          category,
          quantity: parseFloat(quantity),
          unit,
          minThreshold: parseFloat(minThreshold),
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        });
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save grocery item');
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
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            {initialData ? <Edit3 className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-extrabold text-base text-primary">
              {initialData ? 'Edit Grocery Item' : 'Add Grocery Item'}
            </h3>
            <p className="text-xs text-secondary">
              {initialData ? 'Update stock quantity, shelf life or threshold' : 'Add new pantry item to stock'}
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
            <label className="text-xs font-bold text-secondary block mb-1">Item Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Basmati Rice, Milk, Eggs"
              className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="Vegetables">Vegetables</option>
                <option value="Dairy & Eggs">Dairy & Eggs</option>
                <option value="Grains & Bread">Grains & Bread</option>
                <option value="Spices & Oils">Spices & Oils</option>
                <option value="Meat & Poultry">Meat & Poultry</option>
                <option value="Snacks & Beverages">Snacks & Beverages</option>
                <option value="Hygiene & Cleaning">Hygiene & Cleaning</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="g">Grams (g)</option>
                <option value="L">Liters (L)</option>
                <option value="ml">Milliliters (ml)</option>
                <option value="pack">Packs</option>
                <option value="box">Boxes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Quantity</label>
              <input
                type="number"
                step="0.01"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Min Alert Stock</label>
              <input
                type="number"
                step="0.01"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3.5 py-2.5 text-xs text-primary font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-secondary block mb-1">
              Expiry Date (Optional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full bg-secondary/60 border border-primary/80 rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-emerald-500 font-medium"
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>{initialData ? 'Update Item' : 'Save Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGroceryModal;
