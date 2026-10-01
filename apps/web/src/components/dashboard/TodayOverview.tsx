import React from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  CheckSquare,
  ArrowRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

interface TodayOverviewProps {
  pendingTasksCount: number;
  billsDueSoonCount: number;
  todayTransactionsCount: number;
  onSelectTab?: (tab: 'bills' | 'tasks') => void;
  onOpenTransactions?: () => void;
}

export const TodayOverview: React.FC<TodayOverviewProps> = ({
  pendingTasksCount,
  billsDueSoonCount,
  todayTransactionsCount,
  onSelectTab,
  onOpenTransactions,
}) => {
  const isEverythingClear =
    pendingTasksCount === 0 && billsDueSoonCount === 0 && todayTransactionsCount === 0;

  return (
    <section
      className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm"
      aria-label="Today At A Glance"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
            Today at a glance
          </h2>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Real-time household status</span>
        </div>
      </div>

      {isEverythingClear ? (
        <div className="pt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Household is calm and fully organized. No pending tasks or urgent bills due today!
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-3">
          {/* 1. Pending Tasks */}
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('tasks')}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 transition-all text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  pendingTasksCount > 0
                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                    : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-400'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                  {pendingTasksCount} Task{pendingTasksCount === 1 ? '' : 's'} Pending
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {pendingTasksCount > 0 ? 'Household chores to complete' : 'All chores completed'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </button>

          {/* 2. Bills Due Soon */}
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('bills')}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 transition-all text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  billsDueSoonCount > 0
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-400'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                  {billsDueSoonCount} Bill{billsDueSoonCount === 1 ? '' : 's'} Due Soon
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {billsDueSoonCount > 0 ? 'Rent & utilities pending' : 'Zero overdue payments'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </button>

          {/* 3. Today's Transactions */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  todayTransactionsCount > 0
                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                    : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-400'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                  {todayTransactionsCount} Transaction{todayTransactionsCount === 1 ? '' : 's'} Today
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {todayTransactionsCount > 0 ? 'Recorded in ledger' : 'No new activity yet today'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
