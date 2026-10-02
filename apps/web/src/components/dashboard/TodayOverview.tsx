import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
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
  const navigate = useNavigate();

  const handleTaskClick = () => {
    navigate('/tasks?status=pending');
  };

  const handleBillClick = () => {
    navigate('/bills?filter=due-soon');
  };

  const handleTransactionClick = () => {
    if (onOpenTransactions) {
      onOpenTransactions();
    } else {
      navigate('/expenses');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

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
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time household status</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-3">
        {/* 1. Pending Tasks Action Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleTaskClick}
          onKeyDown={(e) => handleKeyDown(e, handleTaskClick)}
          aria-label={`${pendingTasksCount} tasks pending. Click to open Tasks workspace.`}
          className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-purple-500/5 dark:hover:bg-purple-500/10 border border-slate-200/70 dark:border-slate-700/70 hover:border-purple-400 dark:hover:border-purple-500 hover:-translate-y-px active:scale-[0.99] transition-all duration-200 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                pendingTasksCount > 0
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500/25'
                  : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-400'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                {pendingTasksCount} Task{pendingTasksCount === 1 ? '' : 's'} Pending
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {pendingTasksCount > 0 ? 'Click to view & assign chores' : 'All chores completed'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
        </div>

        {/* 2. Bills Due Soon Action Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleBillClick}
          onKeyDown={(e) => handleKeyDown(e, handleBillClick)}
          aria-label={`${billsDueSoonCount} bills due soon. Click to open Bills workspace.`}
          className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 border border-slate-200/70 dark:border-slate-700/70 hover:border-amber-400 dark:hover:border-amber-500 hover:-translate-y-px active:scale-[0.99] transition-all duration-200 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                billsDueSoonCount > 0
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/25'
                  : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-400'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                {billsDueSoonCount} Bill{billsDueSoonCount === 1 ? '' : 's'} Due Soon
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {billsDueSoonCount > 0 ? 'Click to inspect pending bills' : 'Zero overdue payments'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
        </div>

        {/* 3. Today's Transactions Action Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleTransactionClick}
          onKeyDown={(e) => handleKeyDown(e, handleTransactionClick)}
          aria-label={`${todayTransactionsCount} transactions today. Click to open Transaction activity.`}
          className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-blue-500/5 dark:hover:bg-blue-500/10 border border-slate-200/70 dark:border-slate-700/70 hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-px active:scale-[0.99] transition-all duration-200 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                todayTransactionsCount > 0
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/25'
                  : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-400'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                {todayTransactionsCount} Transaction{todayTransactionsCount === 1 ? '' : 's'} Today
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {todayTransactionsCount > 0 ? 'Click to inspect activity' : 'Click to view ledger'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
        </div>
      </div>
    </section>
  );
};

export default TodayOverview;
