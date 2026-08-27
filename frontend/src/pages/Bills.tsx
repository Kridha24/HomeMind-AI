import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle, Clock, AlertTriangle, Trash2, Edit3, Sparkles } from 'lucide-react';
import apiClient from '../services/apiClient';
import { Bill } from '../types';
import { useSettingStore } from '../stores/useSettingStore';
import { EmptyState } from '../components/common/EmptyState';
import { AddBillModal } from '../components/common/AddBillModal';

export const Bills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  const { format, currencySymbol } = useSettingStore();

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/bills');
      const list = Array.isArray(res.data) ? res.data : res.data?.bills || [];
      setBills(list);
    } catch (e) {
      console.error(e);
      setBills([]);
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bill record?')) return;
    try {
      await apiClient.delete(`/bills/${id}`);
      fetchBills();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setShowAddModal(true);
  };

  const handleAddNew = () => {
    setEditingBill(null);
    setShowAddModal(true);
  };

  const unpaidTotal = bills
    .filter((b) => b.status === 'UNPAID' || b.status === 'OVERDUE')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-primary/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" /> Utility Bills & Rent
          </h1>
          <p className="text-xs text-secondary">
            Keep track of due dates, utility accounts, and settlements in {currencySymbol}
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-md shadow-amber-600/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Bill</span>
        </button>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 border-amber-500/30 bg-amber-50/50 dark:bg-gradient-to-tr dark:from-slate-900 dark:via-amber-950/20 dark:to-slate-900 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
            Total Pending Bills
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-800 dark:text-amber-400 font-mono">
            -{format(unpaidTotal)}
          </p>
          <p className="text-[11px] text-muted">Awaiting payment settlement</p>
        </div>

        <div className="glass-panel p-5 border-primary/80 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Bills Logged</span>
          <p className="text-2xl font-extrabold text-primary font-mono">{bills.length} Bills</p>
          <p className="text-[11px] text-muted">Across this household</p>
        </div>

        <div className="glass-panel p-5 border-primary/80 space-y-1 shadow-sm">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Paid Bills</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {bills.filter((b) => b.status === 'PAID').length} Settled
          </p>
          <p className="text-[11px] text-muted">Archived payments</p>
        </div>
      </div>

      {/* Bills Cards Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-muted">Loading utility bills from database...</div>
      ) : bills.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No utility bills registered yet"
          description="Register electricity, water, internet, or room rent to receive reminders before due date."
          actionLabel="+ Add First Bill"
          onAction={handleAddNew}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="glass-panel p-5 border-primary/80 space-y-4 hover:border-amber-500/50 transition-all flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                      {bill.category}
                    </span>
                    <h3 className="font-bold text-base text-primary mt-0.5">{bill.title}</h3>
                    {bill.provider && <p className="text-xs text-secondary mt-0.5">{bill.provider}</p>}
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      bill.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        : bill.status === 'OVERDUE'
                        ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                        : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                    }`}
                  >
                    {bill.status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-t border-b border-primary/80 py-3">
                  <span className="text-xs text-muted font-semibold">Amount</span>
                  <span className="text-xl font-extrabold font-mono text-primary">-{format(bill.amount)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Due: {new Date(bill.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-primary/60">
                <div className="flex items-center gap-1">
                  {/* Edit Button */}
                  <button
                    onClick={() => handleEdit(bill)}
                    className="p-1.5 text-secondary hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Edit Bill"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(bill.id)}
                    className="p-1.5 text-secondary hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete Bill"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {bill.status === 'UNPAID' && (
                  <button
                    onClick={() => handleMarkPaid(bill.id)}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-xl transition-all shadow-xs"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Bill Modal */}
      <AddBillModal
        isOpen={showAddModal}
        initialData={editingBill}
        onClose={() => {
          setShowAddModal(false);
          setEditingBill(null);
        }}
        onSuccess={fetchBills}
      />
    </div>
  );
};

export default Bills;
