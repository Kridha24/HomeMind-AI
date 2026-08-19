import React, { useEffect, useState } from 'react';
import { CheckSquare, CreditCard, ShoppingBag, Sparkles, TrendingUp } from 'lucide-react';
import apiClient from '../../services/apiClient';

interface DailySummaryData {
  greeting: string;
  householdName: string;
  metrics: {
    pendingTasksCount: number;
    unpaidBillsCount: number;
    unpaidBillsTotal: string;
    lowStockItemsCount: number;
    monthlySavings: string;
  };
  insight: string;
}

export const DailyHomeSummary: React.FC = () => {
  const [summary, setSummary] = useState<DailySummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await apiClient.get('/assistant/summary');
        setSummary(res.data);
      } catch (e) {
        console.warn('Failed to load daily assistant summary:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-3">
        <div className="h-4 bg-slate-800 rounded w-1/3" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="h-12 bg-slate-800/60 rounded-xl" />
          <div className="h-12 bg-slate-800/60 rounded-xl" />
          <div className="h-12 bg-slate-800/60 rounded-xl" />
          <div className="h-12 bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/[0.08] backdrop-blur-xl shadow-xl space-y-3.5">
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
            {summary.greeting} 👋
          </h3>
          <p className="text-xs text-slate-400">
            Intelligent telemetry for <strong className="text-slate-300">{summary.householdName}</strong>
          </p>
        </div>
      </div>

      {/* 4 Live Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Tasks */}
        <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-white/[0.05] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <CheckSquare className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-white block">
              {summary.metrics.pendingTasksCount}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">Pending Tasks</span>
          </div>
        </div>

        {/* Unpaid Bills */}
        <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-white/[0.05] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-white block">
              {summary.metrics.unpaidBillsTotal}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {summary.metrics.unpaidBillsCount} Unpaid Dues
            </span>
          </div>
        </div>

        {/* Low Stock Pantry */}
        <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-white/[0.05] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-white block">
              {summary.metrics.lowStockItemsCount} Items
            </span>
            <span className="text-[10px] text-slate-400 block truncate">Low in Pantry</span>
          </div>
        </div>

        {/* Net Monthly Balance */}
        <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-white/[0.05] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-white block">
              {summary.metrics.monthlySavings}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">Monthly Balance</span>
          </div>
        </div>
      </div>

      {/* Proactive AI Insight */}
      {summary.insight && (
        <div className="p-3 rounded-2xl bg-blue-500/[0.08] border border-blue-500/20 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-300 block">
              HomeMind Proactive Insight
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {summary.insight}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
