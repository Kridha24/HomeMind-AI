import React from 'react';
import { AlertCircle, Clock, CheckCircle2, TrendingDown } from 'lucide-react';
import { BillSummaryMetrics } from '../utils/billStatus';
import { formatINR } from '../utils/billFormatters';

interface BillsSummaryProps {
  metrics: BillSummaryMetrics;
  activeFilter?: string;
  onFilterSelect?: (filter: string) => void;
}

export const BillsSummary: React.FC<BillsSummaryProps> = ({
  metrics,
  activeFilter,
  onFilterSelect,
}) => {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Bills Summary Metrics">
      {/* 1. Total Due */}
      <div
        onClick={() => onFilterSelect?.('unpaid')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onFilterSelect?.('unpaid')}
        className={`glass-panel p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
          activeFilter === 'unpaid'
            ? 'border-amber-500 bg-amber-500/5 shadow-xs ring-1 ring-amber-500/30'
            : 'border-primary/80 hover:border-amber-500/50'
        }`}
      >
        <div className="h-[2.5px] w-full bg-gradient-to-r from-amber-500 to-orange-400 absolute top-0 left-0 right-0 opacity-80 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Total Due
          </span>
          <div className="w-7 h-7 rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center transition-transform group-hover:scale-105">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-amber-400 font-mono mt-2 truncate">
          {formatINR(metrics.totalDue)}
        </p>
        <p className="text-[11px] text-secondary mt-1">
          {metrics.unpaidCount} bill{metrics.unpaidCount === 1 ? '' : 's'} pending
        </p>
      </div>

      {/* 2. Due This Week */}
      <div
        onClick={() => onFilterSelect?.('due-soon')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onFilterSelect?.('due-soon')}
        className={`glass-panel p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
          activeFilter === 'due-soon'
            ? 'border-blue-500 bg-blue-500/5 shadow-xs ring-1 ring-blue-500/30'
            : 'border-primary/80 hover:border-blue-500/50'
        }`}
      >
        <div className="h-[2.5px] w-full bg-gradient-to-r from-blue-500 to-sky-400 absolute top-0 left-0 right-0 opacity-80 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
            Due This Week
          </span>
          <div className="w-7 h-7 rounded-xl bg-blue-500/12 text-blue-600 dark:text-blue-400 border border-blue-500/25 flex items-center justify-center transition-transform group-hover:scale-105">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-2 truncate">
          {metrics.dueThisWeekCount}
        </p>
        <p className="text-[11px] text-secondary mt-1 truncate">
          {metrics.dueThisWeekCount > 0 ? `${formatINR(metrics.dueThisWeekAmount)} due next 7d` : 'No bills due this week'}
        </p>
      </div>

      {/* 3. Overdue */}
      <div
        onClick={() => onFilterSelect?.('overdue')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onFilterSelect?.('overdue')}
        className={`glass-panel p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
          metrics.overdueCount > 0
            ? 'border-rose-500/40 bg-rose-500/5 hover:border-rose-500'
            : 'border-primary/80 hover:border-rose-500/40'
        } ${activeFilter === 'overdue' ? 'ring-1 ring-rose-500/40 shadow-xs' : ''}`}
      >
        <div className="h-[2.5px] w-full bg-gradient-to-r from-rose-500 to-red-400 absolute top-0 left-0 right-0 opacity-80 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
            Overdue
          </span>
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 ${
              metrics.overdueCount > 0
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <p
          className={`text-xl sm:text-2xl font-extrabold font-mono mt-2 truncate ${
            metrics.overdueCount > 0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-primary'
          }`}
        >
          {metrics.overdueCount}
        </p>
        <p className="text-[11px] text-secondary mt-1 truncate">
          {metrics.overdueCount > 0
            ? `${formatINR(metrics.overdueAmount)} needs action`
            : '✓ Zero overdue bills'}
        </p>
      </div>

      {/* 4. Paid This Month */}
      <div
        onClick={() => onFilterSelect?.('paid')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onFilterSelect?.('paid')}
        className={`glass-panel p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
          activeFilter === 'paid'
            ? 'border-emerald-500 bg-emerald-500/5 shadow-xs ring-1 ring-emerald-500/30'
            : 'border-primary/80 hover:border-emerald-500/50'
        }`}
      >
        <div className="h-[2.5px] w-full bg-gradient-to-r from-emerald-500 to-teal-400 absolute top-0 left-0 right-0 opacity-80 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Paid This Month
          </span>
          <div className="w-7 h-7 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center transition-transform group-hover:scale-105">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-2 truncate">
          {formatINR(metrics.paidThisMonthAmount)}
        </p>
        <p className="text-[11px] text-secondary mt-1">
          {metrics.paidThisMonthCount} bill{metrics.paidThisMonthCount === 1 ? '' : 's'} settled
        </p>
      </div>
    </section>
  );
};
