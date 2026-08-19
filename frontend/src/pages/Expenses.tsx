import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, DollarSign, Calendar, Tag, Trash2, TrendingUp, Sparkles, Filter } from 'lucide-react';
import apiClient from '../services/apiClient';
import { Expense } from '../types';
import { useSettingStore } from '../stores/useSettingStore';
import { EmptyState } from '../components/common/EmptyState';

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { format, currencySymbol } = useSettingStore();

  const fetchExpenses = async () => {
    try {
      const res = await apiClient.get('/expenses');
      const list = Array.isArray(res.data) ? res.data : (res.data?.expenses || []);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    try {
      await apiClient.post('/expenses', {
        title,
        amount: parseFloat(amount),
        category,
        date,
      });
      setTitle('');
      setAmount('');
      setShowForm(false);
      fetchExpenses();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (e) {
      console.error(e);
    }
  };

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-primary">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-400" /> Household Expense Ledger
          </h1>
          <p className="text-xs text-muted">Track and manage every household transaction in database</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Expense</span>
        </button>
      </div>

      {/* Form Card */}
      {showForm && (
        <form onSubmit={handleCreate} className="glass-panel p-6 border-primary space-y-4 animate-in zoom-in-95 duration-150">
          <h3 className="text-sm font-bold text-primary border-b border-primary pb-2">Record New Household Outlay</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Whole Foods Supermarket"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-background border border-primary rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Amount ({currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="84.50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-background border border-primary rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-background border border-primary rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-blue-500/50"
              >
                <option value="Groceries">Groceries</option>
                <option value="Utilities">Utilities</option>
                <option value="Dining">Dining Out</option>
                <option value="Maintenance">Home Maintenance</option>
                <option value="Health">Health & Pharmacy</option>
                <option value="Entertainment">Entertainment</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-secondary block mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-background border border-primary rounded-xl px-3 py-2 text-xs text-primary focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs text-muted hover:text-primary px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow"
            >
              Save Expense
            </button>
          </div>
        </form>
      )}

      {/* Summary Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 border-primary flex items-center justify-between">
          <div>
            <span className="text-xs text-muted font-semibold block">Total Logged Spend</span>
            <span className="text-2xl font-extrabold text-primary font-mono mt-1 block">{format(totalSpent)}</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
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
          description="Start tracking your household outlays, grocery purchases, and bill receipts in your dynamic multi-currency database ledger."
          actionLabel="+ Add Expense"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="glass-panel border-primary overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-background/60 border-b border-primary text-muted uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Title</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5 text-right">Amount</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-primary">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-panel/40 transition-colors">
                  <td className="px-6 py-4 font-semibold text-primary flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                    {expense.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-secondary text-secondary border border-secondary">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-mono font-bold text-right text-emerald-400">
                    {format(expense.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-muted hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
