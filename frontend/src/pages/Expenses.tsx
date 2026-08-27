import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, DollarSign, Calendar, Tag, Trash2, Edit3, TrendingUp, Sparkles, Filter } from 'lucide-react';
import apiClient from '../services/apiClient';
import { Expense } from '../types';
import { useSettingStore } from '../stores/useSettingStore';
import { EmptyState } from '../components/common/EmptyState';
import { AddExpenseModal } from '../components/common/AddExpenseModal';

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  const { format, currencySymbol } = useSettingStore();

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/expenses');
      const list = Array.isArray(res.data) ? res.data : res.data?.expenses || [];
      setExpenses(list);
    } catch (e) {
      console.error(e);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await apiClient.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingExpense(null);
    setShowModal(true);
  };

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-primary/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Household Expense Ledger
          </h1>
          <p className="text-xs text-secondary">Track and manage every household transaction in database</p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-md shadow-blue-600/25 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Expense</span>
        </button>
      </div>

      {/* Summary Widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 border-red-500/30 bg-red-50/50 dark:bg-gradient-to-tr dark:from-slate-900 dark:via-red-950/20 dark:to-slate-900 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider block">
              Total Logged Spend
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 font-mono mt-1 block">
              -{format(totalSpent)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 border-primary/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-muted uppercase tracking-wider block">
              Total Transactions
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-primary font-mono mt-1 block">
              {expenses.length} Records
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Expense List Table / Empty State */}
      {loading ? (
        <div className="text-center py-12 text-xs text-muted">Loading household expenses from database...</div>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No expenses added yet"
          description="Start tracking your household outlays, grocery purchases, and bill receipts in your dynamic ledger."
          actionLabel="+ Add Expense"
          onAction={handleAddNew}
        />
      ) : (
        <div className="glass-panel border-primary/80 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-primary/80 font-bold text-sm text-primary flex items-center justify-between bg-secondary/30">
            <span>Expenses List</span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold">
              {expenses.length} Entries
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 border-b border-primary/80 text-secondary uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Title</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5 text-right">Amount ({currencySymbol})</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-secondary font-medium">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-primary flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-blue-500" />
                      {expense.title}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400 uppercase tracking-wider">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted font-mono text-[11px]">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-right text-red-600 dark:text-red-400">
                      -{format(expense.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEdit(expense)}
                          className="p-1.5 text-secondary hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit Expense"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 text-secondary hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={showModal}
        initialData={editingExpense}
        onClose={() => {
          setShowModal(false);
          setEditingExpense(null);
        }}
        onSuccess={fetchExpenses}
      />
    </div>
  );
};

export default Expenses;
