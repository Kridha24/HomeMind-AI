import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import apiClient from '../services/apiClient';
import { Bill } from '../types';
import { useSettingStore } from '../stores/useSettingStore';
import { EmptyState } from '../components/common/EmptyState';
import { AddBillModal } from '../components/common/AddBillModal';

export const Bills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const { format } = useSettingStore();

  const fetchBills = async () => {
    try {
      const res = await apiClient.get('/bills');
      setBills(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleMarkPaid = async (id: string) => {
    try {
      await apiClient.put(`/bills/${id}/pay`);
      fetchBills();
    } catch (e) {
      console.error(e);
    }
  };

  const unpaidTotal = bills
    .filter((b) => b.status === 'UNPAID')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-400" /> Utility Bills & Recurring Payments
          </h1>
          <p className="text-xs text-slate-400">Monitor upcoming due dates, recurring utilities & payment records</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Bill</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Outstanding Bill Total</span>
            <span className="text-2xl font-extrabold text-amber-400 font-mono mt-1 block">
              {format(unpaidTotal)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Bill List / Empty State */}
      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading utility bills from database...</div>
      ) : bills.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No bills added yet"
          description="Keep your household utilities organized by adding upcoming electricity, water, internet, and rent bills to track due dates and avoid late fees."
          actionLabel="+ Add Bill"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="glass-panel p-5 border-slate-800 space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {bill.category}
                  </span>
                  <h3 className="font-bold text-base text-slate-100 mt-0.5">{bill.title}</h3>
                  {bill.provider && <p className="text-xs text-slate-400 mt-0.5">{bill.provider}</p>}
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    bill.status === 'PAID'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : bill.status === 'OVERDUE'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {bill.status}
                </span>
              </div>

              <div className="flex items-baseline justify-between border-t border-b border-slate-800/80 py-3">
                <span className="text-xs text-slate-400 font-semibold">Amount Due</span>
                <span className="text-xl font-extrabold font-mono text-slate-100">{format(bill.amount)}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Due: {new Date(bill.dueDate).toLocaleDateString()}
                </span>
                {bill.status === 'UNPAID' && (
                  <button
                    onClick={() => handleMarkPaid(bill.id)}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl transition-all"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddBillModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchBills}
      />
    </div>
  );
};
