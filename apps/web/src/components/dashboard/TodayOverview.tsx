import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  FileText,
  ShoppingBag,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useI18n } from '../../utils/i18n';

interface TodayOverviewProps {
  pendingTasksCount: number;
  billsDueSoonCount: number;
  todayTransactionsCount?: number;
  userRole?: string;
  onSelectTab?: (tab: 'bills' | 'tasks') => void;
  onOpenTransactions?: () => void;
}

export const TodayOverview: React.FC<TodayOverviewProps> = ({
  pendingTasksCount,
  billsDueSoonCount,
  userRole = 'MEMBER',
  onSelectTab,
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleTaskClick = () => {
    navigate('/tasks?status=pending');
  };

  const handleBillClick = () => {
    navigate('/bills?filter=due-soon');
  };

  const handleGroceryClick = () => {
    navigate('/groceries');
  };

  return (
    <section className="space-y-3" aria-label="Today At A Glance">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Today At A Glance
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Your home, simplified
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">Real-time household status</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/analytics')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* A. Tasks card */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleTaskClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTaskClick(); }}
          className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-purple-500/50 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate group-hover:text-purple-600 transition-colors">
                {pendingTasksCount} Tasks Pending
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                Assigned household chores
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
        </div>

        {/* B. Bills card */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleBillClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleBillClick(); }}
          className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500/50 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate group-hover:text-amber-600 transition-colors">
                {billsDueSoonCount} Bills Due Soon
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                Upcoming utility bills
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
        </div>

        {/* C. Shared Groceries card */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleGroceryClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleGroceryClick(); }}
          className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate group-hover:text-emerald-600 transition-colors">
                Shared Groceries
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                Pantry and household grocery shopping list
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
        </div>
      </div>
    </section>
  );
};

export default TodayOverview;
