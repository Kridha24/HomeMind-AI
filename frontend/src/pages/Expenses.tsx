import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Download, TrendingUp, PieChart, Trash2, Tag, Calendar } from 'lucide-react';
import apiClient from '../services/apiClient';
import { Expense } from '../types';

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await apiClient.get('/expenses');
      setExpenses(res.data.expenses);
    } catch (e) {
      setExpenses([
        { id: '1', title: 'Organic Supermarket Grocery', amount: 245.80, category: 'Groceries', date: '2026-07-25', isRecurring: false },
        { id: '2', title: 'Weekly Farmers Market', amount: 84.50, category: 'Groceries', date: '2026-07-28', isRecurring: false },
        { id: '3', title: 'High-Speed Fiber Internet', amount: 89.99, category: 'Utilities', date: '2026-07-10', isRecurring: true }
      ]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    try {
      await apiClient.post('/expenses', { title, amount, category });
      setShowModal(false);
      setTitle('');
      setAmount('');
      fetchExpenses();
    } catch (e) {
      alert('Error creating expense');
    }
  };

  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Expense Management & Budgeting
            <Wallet className="w-5 h-5 text-blue-400" />
          </h1>
          <p className="text-xs text-slate-400">Track income, categorize outlays, and run spending predictions</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/v1/reports/monthly/pdf"
            target="_blank"
            rel="noreferrer"
            className="glass-panel px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export PDF
          </a>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4">
          <span className="text-xs font-semibold text-slate-400">Total Month Spend</span>
          <p className="text-2xl font-bold text-slate-100 mt-1">${totalExpense.toFixed(2)}</p>
        </div>
        <div className="glass-panel p-4">
          <span className="text-xs font-semibold text-slate-400">Monthly Budget Cap</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">$1,500.00</p>
        </div>
        <div className="glass-panel p-4">
          <span className="text-xs font-semibold text-slate-400">Remaining Budget</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">${(1500 - totalExpense).toFixed(2)}</p>
        </div>
      </div>

      {/* Expense Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-200">Recent Household Outlays</h3>
          <span className="text-xs text-slate-400">{expenses.length} Records</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Category</th>
              <th className="p-4">Date</th>
              <th className="p-4">Amount</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-medium text-slate-100 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  {exp.title}
                </td>
                <td className="p-4">
                  <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-[11px]">
                    {exp.category}
                  </span>
                </td>
                <td className="p-4 text-slate-400">{exp.date.split('T')[0]}</td>
                <td className="p-4 font-bold text-slate-100">${exp.amount.toFixed(2)}</td>
                <td className="p-4 text-right">
                  <button className="text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-100">Log Household Expense</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Organic Supermarket Grocery"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="Groceries">Groceries</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Household">Household</option>
                  <option value="Health">Health</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
