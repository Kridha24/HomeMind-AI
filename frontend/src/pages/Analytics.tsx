import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import apiClient from '../services/apiClient';
import { useSettingStore } from '../stores/useSettingStore';
import { EmptyState } from '../components/common/EmptyState';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { format, currencySymbol } = useSettingStore();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiClient.get('/dashboard/summary');
        setData(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const totalSpent = data?.monthlyExpenses || 0;
  const totalBills = data?.unpaidBillsTotal || 0;
  const isDataEmpty = !data || (data.totalExpensesCount === 0 && data.totalBillsCount === 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="glass-panel p-6 border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" /> Household Analytics & Spend Telemetry
          </h1>
          <p className="text-xs text-slate-400">Financial velocity, budget limits & household telemetry in {currencySymbol}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-400">Loading household analytics...</div>
      ) : isDataEmpty ? (
        <EmptyState
          icon={BarChart3}
          title="Start adding data to view insights"
          description="Your analytical graphs and spending velocity charts will generate automatically as you log household expenses and bills."
          actionLabel="+ Add Expense"
          onAction={() => (window.location.href = '/expenses')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-400 block">Total Monthly Expenses</span>
            <span className="text-3xl font-extrabold text-slate-100 font-mono block">{format(totalSpent)}</span>
          </div>
          <div className="glass-panel p-6 border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-400 block">Outstanding Utility Bills</span>
            <span className="text-3xl font-extrabold text-amber-400 font-mono block">{format(totalBills)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
