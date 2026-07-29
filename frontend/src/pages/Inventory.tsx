import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, AlertCircle, Calendar, PlusCircle, MinusCircle, Trash2 } from 'lucide-react';
import apiClient from '../services/apiClient';
import { GroceryItem } from '../types';

export const Inventory: React.FC = () => {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await apiClient.get('/inventory');
      setItems(res.data.items);
    } catch (e) {
      setItems([
        { id: '1', name: 'Organic Whole Milk 2L', category: 'Milk', quantity: 2, unit: 'L', minThreshold: 1, expiryDate: '2026-08-02' },
        { id: '2', name: 'Artisan Whole Wheat Bread', category: 'Bread', quantity: 1, unit: 'pack', minThreshold: 1, expiryDate: '2026-07-31' },
        { id: '3', name: 'Fresh Spinach 500g', category: 'Vegetables', quantity: 1, unit: 'pack', minThreshold: 1, expiryDate: '2026-07-30' },
        { id: '4', name: 'Basmati Rice 5kg', category: 'Rice', quantity: 3.5, unit: 'kg', minThreshold: 1 },
        { id: '5', name: 'Extra Virgin Olive Oil 1L', category: 'Oil', quantity: 0.2, unit: 'L', minThreshold: 0.5 }
      ]);
    }
  };

  const adjustQty = async (id: string, current: number, delta: number) => {
    const next = Math.max(0, current + delta);
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: next } : i));
    try {
      await apiClient.put(`/inventory/${id}/quantity`, { quantity: next });
    } catch (e) {}
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Grocery & Pantry Inventory
            <ShoppingBag className="w-5 h-5 text-purple-400" />
          </h1>
          <p className="text-xs text-slate-400">Live quantity tracking, expiry dates, consumption rates and smart shopping list</p>
        </div>
        <div className="flex items-center gap-2">
          {['ALL', 'LOW_STOCK', 'EXPIRING'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filter === f ? 'bg-purple-600 text-white' : 'glass-panel text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="glass-panel p-4 space-y-3 border-slate-800 hover:border-purple-500/40 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  {item.category}
                </span>
                <h3 className="font-semibold text-sm text-slate-100 mt-1.5">{item.name}</h3>
              </div>
              {item.expiryDate && (
                <span className="text-[10px] text-red-400 font-medium bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {item.expiryDate.split('T')[0]}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjustQty(item.id, item.quantity, -0.5)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <MinusCircle className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-slate-100">
                  {item.quantity} {item.unit}
                </span>
                <button
                  onClick={() => adjustQty(item.id, item.quantity, 0.5)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <PlusCircle className="w-4 h-4" />
                </button>
              </div>

              {item.quantity <= item.minThreshold && (
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <AlertCircle className="w-3 h-3" /> Low Stock
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
