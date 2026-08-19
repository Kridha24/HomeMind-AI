import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Calendar, Tag, Trash2, TrendingUp, Sparkles, X, RefreshCw } from 'lucide-react';
import apiClient from '../services/apiClient';
import { useSettingStore } from '../stores/useSettingStore';
import { EmptyState } from '../components/common/EmptyState';

interface IncomeRecord {
  id: string;
  title: string;
  amount: number;
  source: string;
  date: string;
}

export const Income: React.FC = () => {
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Salary');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { format, currencySymbol } = useSettingStore();

  const fetchIncomes = async () => {
    try {
      const res = await apiClient.get('/income');
      const list = Array.isArray(res.data) ? res.data : (res.data?.incomes || []);
      setIncomes(list);
    } catch (e) {
      console.error(e);
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    setSubmitting(true);
    setError('');

    try {
      await apiClient.post('/income', {
        title,
        amount: parseFloat(amount),
        source,
        date,
      });

      setTitle('');
      setAmount('');
      setShowModal(false);
      fetchIncomes();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add income record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/income/${id}`);
      fetchIncomes();
    } catch (e) {
      console.error(e);
    }
  };

  const totalMonthlyIncome = (incomes || []).reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 border-primary">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-400" /> Income & Earnings Ledger
          </h1>
          <p className="text-xs text-muted">Track and manage every household income source and monthly revenue stream in {currencySymbol}</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Income Record</span>
        </button>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 border-emerald-500/30 bg-gradient-to-tr from-slate-900 via-emerald-950/20 to-slate-900 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total Monthly Income</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-primary font-mono">{format(totalMonthlyIncome)}</p>
          <p className="text-[11px] text-muted">Recorded across {incomes.length} earnings streams</p>
        </div>

        <div className="glass-panel p-6 border-primary space-y-2">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Primary Income Source</span>
          <p className="text-2xl font-extrabold text-primary">{incomes.length > 0 ? incomes[0].source : 'Salary'}</p>
          <p className="text-[11px] text-emerald-400">Direct deposit / verified revenue</p>
        </div>

        <div className="glass-panel p-6 border-primary space-y-2">
          <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Income Entries</span>
          <p className="text-2xl font-extrabold text-indigo-400 font-mono">{incomes.length} Records</p>
          <p className="text-[11px] text-muted">Historical database ledger</p>
        </div>
      </div>

      {/* Income History Table */}
      {loading ? (
        <div className="text-center py-12 text-xs text-muted">Loading income ledger...</div>
      ) : incomes.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No income records logged yet"
          description="Track your monthly salary, freelance earnings, investments, and side hustles in your active household currency."
          actionLabel="+ Add First Income Entry"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="glass-panel border-primary overflow-hidden">
          <div className="p-4 border-b border-primary font-bold text-sm text-primary flex items-center justify-between">
            <span>Historical Income Transactions</span>
            <span className="text-xs text-emerald-400 font-mono">{incomes.length} Entries</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background/60 text-muted uppercase tracking-wider font-semibold border-b border-primary">
                <tr>
                  <th className="p-4">Transaction Title</th>
                  <th className="p-4">Source Category</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Amount ({currencySymbol})</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-secondary">
                {incomes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-panel/40 transition-colors">
                    <td className="p-4 font-semibold text-primary flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        {currencySymbol}
                      </div>
                      {inc.title}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                        {inc.source}
                      </span>
                    </td>
                    <td className="p-4 text-muted font-mono text-[11px]">
                      {new Date(inc.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-400 font-mono text-sm">
                      +{format(inc.amount)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(inc.id)}
                        className="p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Income Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Income Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-panel border border-primary rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-muted hover:text-white p-1 rounded-lg hover:bg-secondary"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-primary">Add Income Entry</h3>
              <p className="text-xs text-muted">Log monthly earnings or side hustle revenue in {currencySymbol}</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">Income Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Tech Salary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-background border border-primary rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">Amount ({currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-background border border-primary rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">Source Category</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-background border border-primary rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="Salary">Salary</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Investments">Investments</option>
                    <option value="Rental">Rental</option>
                    <option value="Business">Business</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-secondary block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-background border border-primary rounded-xl px-3.5 py-2.5 text-xs text-primary focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all mt-4"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save Income Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
