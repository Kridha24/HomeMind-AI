import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, AlertCircle, Trash2, Calendar, Edit3, Sparkles } from 'lucide-react';
import apiClient from '../services/apiClient';
import { GroceryItem } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { AddGroceryModal } from '../components/common/AddGroceryModal';

export const Inventory: React.FC = () => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/inventory');
      const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setItems(list);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdateQty = async (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);

    try {
      await apiClient.put(`/inventory/${id}/quantity`, { quantity: newQty });
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: newQty } : i)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this grocery item?')) return;
    try {
      await apiClient.delete(`/inventory/${id}`);
      fetchInventory();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (item: GroceryItem) => {
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setShowAddModal(true);
  };

  const lowStockCount = items.filter((i) => i.quantity <= i.minThreshold).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-primary/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-500" /> Kitchen & Grocery Inventory
          </h1>
          <p className="text-xs text-secondary">
            Keep track of food stocks, expiration dates, and pantry items
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-md shadow-emerald-600/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Grocery Item</span>
        </button>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 border-primary/80 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Stock Items</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-primary font-mono">{items.length} Items</p>
          <p className="text-[11px] text-muted">Currently in stock</p>
        </div>

        <div className="glass-panel p-5 border-amber-500/30 bg-amber-50/50 dark:bg-gradient-to-tr dark:from-slate-900 dark:via-amber-950/20 dark:to-slate-900 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
            Low Stock Warnings
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-800 dark:text-amber-400 font-mono">
            {lowStockCount} Items
          </p>
          <p className="text-[11px] text-muted">Restock recommended</p>
        </div>

        <div className="glass-panel p-5 border-emerald-500/30 bg-emerald-50/50 dark:bg-gradient-to-tr dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Sufficient Stock
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
            {items.length - lowStockCount} Items
          </p>
          <p className="text-[11px] text-muted">Healthy inventory levels</p>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-muted">Loading pantry items from database...</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your pantry is empty"
          description="Start building your digital food stock registry to receive automated restock reminders."
          actionLabel="+ Add Inventory"
          onAction={handleAddNew}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-5 border-primary/80 space-y-4 hover:border-emerald-500/50 transition-all flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-base text-primary mt-0.5">{item.name}</h3>
                  </div>
                  {item.quantity <= item.minThreshold && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Low Stock
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-b border-primary/80 py-3">
                  <span className="text-xs text-muted font-semibold">Quantity On Hand</span>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => handleUpdateQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-secondary border border-primary/80 text-primary font-bold hover:bg-secondary/80 flex items-center justify-center text-sm active:scale-95 transition-all"
                    >
                      -
                    </button>
                    <span className="text-base font-extrabold font-mono text-primary px-1">
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-secondary border border-primary/80 text-primary font-bold hover:bg-secondary/80 flex items-center justify-center text-sm active:scale-95 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted">
                  {item.expiryDate ? (
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      Exp: {new Date(item.expiryDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span>No Expiry Date</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-primary/60">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-1.5 text-secondary hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                  title="Edit Item"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-secondary hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddGroceryModal
        isOpen={showAddModal}
        initialData={editingItem}
        onClose={() => {
          setShowAddModal(false);
          setEditingItem(null);
        }}
        onSuccess={fetchInventory}
      />
    </div>
  );
};

export default Inventory;
