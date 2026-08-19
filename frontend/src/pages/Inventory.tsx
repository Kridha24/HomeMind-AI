import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, AlertCircle, Calendar, Trash2, RefreshCw } from 'lucide-react';
import apiClient from '../services/apiClient';
import { GroceryItem } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { AddGroceryModal } from '../components/common/AddGroceryModal';

export const Inventory: React.FC = () => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchInventory = async () => {
    try {
      const res = await apiClient.get('/inventory');
      const list = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.groceries || []);
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
    try {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      const newQty = Math.max(0, item.quantity + delta);
      await apiClient.put(`/inventory/${id}/quantity`, { quantity: newQty });
      fetchInventory();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/inventory/${id}`);
      fetchInventory();
    } catch (e) {
      console.error(e);
    }
  };

  const lowStockCount = items.filter((i) => i.quantity <= i.minThreshold).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-primary">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-400" /> Grocery & Pantry Inventory
          </h1>
          <p className="text-xs text-muted">Monitor food stock levels, low threshold warnings & expiration dates</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Grocery Item</span>
        </button>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 border-primary flex items-center justify-between">
          <div>
            <span className="text-xs text-muted font-semibold block">Total Pantry Items</span>
            <span className="text-2xl font-extrabold text-primary font-mono mt-1 block">{items.length}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 border-primary flex items-center justify-between">
          <div>
            <span className="text-xs text-muted font-semibold block">Low Stock Alerts</span>
            <span className="text-2xl font-extrabold text-amber-400 font-mono mt-1 block">{lowStockCount}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Inventory List / Empty State */}
      {loading ? (
        <div className="text-center py-12 text-xs text-muted">Loading pantry inventory from database...</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your pantry is empty"
          description="Start building your digital food stock registry to receive automated restock reminders and zero-food-waste recipe suggestions."
          actionLabel="+ Add Inventory"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-5 border-primary space-y-4 hover:border-secondary transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                    {item.category}
                  </span>
                  <h3 className="font-bold text-base text-primary mt-0.5">{item.name}</h3>
                </div>
                {item.quantity <= item.minThreshold && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Low Stock
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-b border-primary/80 py-3">
                <span className="text-xs text-muted font-semibold">Quantity On Hand</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpdateQty(item.id, -1)}
                    className="w-7 h-7 rounded-lg bg-panel border border-primary text-secondary font-bold hover:bg-secondary"
                  >
                    -
                  </button>
                  <span className="text-base font-extrabold font-mono text-primary">
                    {item.quantity} {item.unit}
                  </span>
                  <button
                    onClick={() => handleUpdateQty(item.id, 1)}
                    className="w-7 h-7 rounded-lg bg-panel border border-primary text-secondary font-bold hover:bg-secondary"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted">
                {item.expiryDate ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Exp: {new Date(item.expiryDate).toLocaleDateString()}
                  </span>
                ) : (
                  <span>No Expiry Date</span>
                )}

                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-muted hover:text-red-400 p-1 rounded hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddGroceryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchInventory}
      />
    </div>
  );
};
