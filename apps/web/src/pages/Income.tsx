import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, Edit3, ArrowUpRight, TrendingUp, Sparkles, Filter, Calendar } from 'lucide-react';
import apiClient from '../services/apiClient';
import { useSettingStore } from '../stores/useSettingStore';
import { EmptyState } from '../components/common/EmptyState';
import { AddIncomeModal } from '../components/common/AddIncomeModal';
import { CompactHeader } from '../components/common/CompactHeader';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

interface IncomeRecord {
  id: string;
  title: string;
  amount: number;
  source: string;
  date: string;
  description?: string;
}

export const Income: React.FC = () => {
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeRecord | null>(null);

  const { format, currencySymbol } = useSettingStore();

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/income');
      const list = Array.isArray(res.data) ? res.data : res.data?.incomes || [];
      setIncomes(list);
    } catch (e) {
      console.error('Failed to load incomes', e);
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record?')) return;
    try {
      await apiClient.delete(`/income/${id}`);
      fetchIncomes();
    } catch (e) {
      console.error('Failed to delete income', e);
    }
  };

  const handleEdit = (inc: IncomeRecord) => {
    setEditingIncome(inc);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingIncome(null);
    setShowModal(true);
  };

  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentMonthShort = now.toLocaleString('default', { month: 'short' });

  // 1. Overall lifetime income across all records
  const overallIncome = (incomes || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // 2. Current Month's Income
  const currentMonthRecords = (incomes || []).filter((inc) => {
    if (!inc.date) return false;
    const d = new Date(inc.date);
    return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const currentMonthIncome = currentMonthRecords.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // 3. Top primary income source
  const sourceTotals = (incomes || []).reduce((acc: Record<string, number>, curr) => {
    const s = curr.source || 'Salary';
    acc[s] = (acc[s] || 0) + (Number(curr.amount) || 0);
    return acc;
  }, {});
  const primarySource = Object.entries(sourceTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Salary';

  // 4. Available months for filtering
  const availableMonths = React.useMemo(() => {
    const monthsMap = new Map<string, string>();
    (incomes || []).forEach((inc) => {
      if (!inc.date) return;
      const d = new Date(inc.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthsMap.set(key, label);
    });
    return Array.from(monthsMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [incomes]);

  const filteredIncomes = selectedMonth === 'ALL'
    ? incomes
    : incomes.filter((inc) => {
        if (!inc.date) return false;
        const d = new Date(inc.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === selectedMonth;
      });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <CompactHeader
        icon={Wallet}
        title="Income & Earnings"
        description={`Track and manage household revenue streams in ${currencySymbol}`}
        accent="income"
        actions={
          <Button
            variant="emerald"
            size="sm"
            icon={Plus}
            onClick={handleAddNew}
          >
            Add Income
          </Button>
        }
      />

      {/* Highlights Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Overall Lifetime Income */}
        <div className="group relative overflow-hidden glass-panel p-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 hover:border-emerald-500/40 hover:-translate-y-px transition-all duration-200 shadow-2xs">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              All-Time
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
            Total Overall Income
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono tracking-tight">
            +{format(overallIncome)}
          </p>
          <p className="text-[11px] text-muted truncate">Across {incomes.length} earnings streams</p>
        </div>

        {/* Current Month's Income */}
        <div className="group relative overflow-hidden glass-panel p-4 rounded-2xl border border-teal-500/25 bg-teal-500/5 hover:border-teal-500/40 hover:-translate-y-px transition-all duration-200 shadow-2xs">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-teal-500 to-emerald-400 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
              {currentMonthShort}
            </span>
          </div>
          <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider block">
            Monthly Income
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-teal-700 dark:text-teal-400 font-mono tracking-tight">
            +{format(currentMonthIncome)}
          </p>
          <p className="text-[11px] text-muted truncate">
            {currentMonthRecords.length} {currentMonthRecords.length === 1 ? 'record' : 'records'} in {currentMonthShort}
          </p>
        </div>

        {/* Primary Income Source */}
        <div className="group relative overflow-hidden glass-panel p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/35 hover:-translate-y-px transition-all duration-200 shadow-2xs">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-cyan-500 to-blue-400 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
              Top Stream
            </span>
          </div>
          <span className="text-[11px] font-bold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider block">Primary Source</span>
          <p className="text-xl sm:text-2xl font-extrabold text-primary truncate">
            {primarySource}
          </p>
          <p className="text-[11px] text-muted truncate">Main financial pillar</p>
        </div>

        {/* Total Income Entries */}
        <div className="group relative overflow-hidden glass-panel p-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 hover:border-violet-500/35 hover:-translate-y-px transition-all duration-200 shadow-2xs">
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-violet-500 to-indigo-400 opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
              Logged
            </span>
          </div>
          <span className="text-[11px] font-bold text-violet-800 dark:text-violet-300 uppercase tracking-wider block">Total Records</span>
          <p className="text-xl sm:text-2xl font-extrabold text-violet-700 dark:text-violet-400 font-mono">
            {incomes.length}
          </p>
          <p className="text-[11px] text-muted truncate">{currentMonthRecords.length} recorded this month</p>
        </div>
      </div>

      {/* Income History Table */}
      {loading ? (
        <div className="text-center py-12 text-xs text-muted">Loading income ledger...</div>
      ) : incomes.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No income records logged yet"
          description="Record your monthly salary, freelance earnings, or dividends to track savings accurately."
          actionLabel="+ Add First Income Entry"
          onAction={handleAddNew}
        />
      ) : (
        <div className="glass-panel border-primary/80 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-primary/80 font-bold text-sm text-primary flex flex-wrap items-center justify-between gap-3 bg-secondary/30">
            <div className="flex items-center gap-2">
              <span>Historical Income Transactions</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                {filteredIncomes.length} {filteredIncomes.length === 1 ? 'Entry' : 'Entries'}
              </span>
            </div>

            {availableMonths.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="text-xs appearance-none bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium cursor-pointer transition-all"
                >
                  <option value="ALL">All Months ({incomes.length})</option>
                  {availableMonths.map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-secondary uppercase tracking-wider font-bold border-b border-primary/80">
                <tr>
                  <th className="p-4">Transaction Title</th>
                  <th className="p-4">Source Category</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Amount ({currencySymbol})</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-secondary font-medium">
                {filteredIncomes.map((inc) => (
                  <tr key={inc.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="p-4 font-bold text-primary flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        {currencySymbol}
                      </div>
                      <div>
                        <span>{inc.title}</span>
                        {inc.description && (
                          <span className="block text-[10px] text-muted font-normal">{inc.description}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="emerald" size="sm">
                        {inc.source}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted font-mono text-[11px]">
                      {new Date(inc.date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      +{format(inc.amount)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEdit(inc)}
                          className="p-1.5 text-secondary hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit Income Record"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(inc.id)}
                          className="p-1.5 text-secondary hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete Income Record"
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

      {/* Add / Edit Income Modal */}
      <AddIncomeModal
        isOpen={showModal}
        initialData={editingIncome}
        onClose={() => {
          setShowModal(false);
          setEditingIncome(null);
        }}
        onSuccess={fetchIncomes}
      />
    </div>
  );
};

export default Income;
