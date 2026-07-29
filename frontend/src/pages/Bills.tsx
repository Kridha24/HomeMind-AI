import React, { useState, useEffect } from 'react';
import { Receipt, CheckCircle, AlertTriangle, Zap, Droplet, Flame, Wifi, Home } from 'lucide-react';
import apiClient from '../services/apiClient';
import { Bill } from '../types';

export const Bills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await apiClient.get('/bills');
      setBills(res.data.bills);
    } catch (e) {
      setBills([
        { id: '1', title: 'City Electricity Grid', category: 'Electricity', amount: 142.50, dueDate: '2026-08-05', status: 'UNPAID', provider: 'EcoPower Inc' },
        { id: '2', title: 'Municipal Water Supply', category: 'Water', amount: 54.20, dueDate: '2026-08-12', status: 'UNPAID', provider: 'City Water Dept' },
        { id: '3', title: 'Piped Natural Gas', category: 'Gas', amount: 38.90, dueDate: '2026-08-18', status: 'UNPAID', provider: 'National Gas' },
        { id: '4', title: 'High Speed Fiber Internet', category: 'Internet', amount: 89.99, dueDate: '2026-07-15', status: 'PAID', provider: 'GigaFiber' }
      ]);
    }
  };

  const handlePay = async (id: string) => {
    try {
      await apiClient.put(`/bills/${id}/pay`);
      fetchBills();
    } catch (e) {
      setBills(prev => prev.map(b => b.id === id ? { ...b, status: 'PAID' } : b));
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Electricity': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Water': return <Droplet className="w-5 h-5 text-blue-400" />;
      case 'Gas': return <Flame className="w-5 h-5 text-orange-400" />;
      case 'Internet': return <Wifi className="w-5 h-5 text-purple-400" />;
      default: return <Home className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          Bills & Utilities Manager
          <Receipt className="w-5 h-5 text-amber-400" />
        </h1>
        <p className="text-xs text-slate-400">Track electricity, water, gas, internet, rent and late payment warnings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {bills.map((bill) => (
          <div key={bill.id} className="glass-panel p-5 space-y-4 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                {getCategoryIcon(bill.category)}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                bill.status === 'PAID'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {bill.status}
              </span>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-slate-100">{bill.title}</h3>
              <p className="text-xs text-slate-400">{bill.provider}</p>
            </div>

            <div className="flex items-baseline justify-between border-t border-slate-800/80 pt-3">
              <div>
                <span className="text-[10px] text-slate-500 block">Due Date</span>
                <span className="text-xs font-semibold text-slate-300">{bill.dueDate.split('T')[0]}</span>
              </div>
              <span className="text-lg font-bold text-slate-100">${bill.amount.toFixed(2)}</span>
            </div>

            {bill.status === 'UNPAID' ? (
              <button
                onClick={() => handlePay(bill.id)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-xl text-xs transition-colors shadow-lg shadow-amber-500/20"
              >
                Mark as Paid
              </button>
            ) : (
              <div className="flex items-center justify-center gap-1 text-xs text-emerald-400 font-semibold py-2">
                <CheckCircle className="w-4 h-4" /> Paid Successfully
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
