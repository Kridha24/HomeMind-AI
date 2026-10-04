import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  FileText,
  CheckSquare,
  ArrowRight,
  TrendingDown,
  ShoppingBag,
} from 'lucide-react';
import { useI18n } from '../../utils/i18n';
import { canViewHouseholdFinancials } from '../../utils/permissions';

interface TodayOverviewProps {
  pendingTasksCount: number;
  billsDueSoonCount: number;
  todayTransactionsCount: number;
  userRole?: string;
  onSelectTab?: (tab: 'bills' | 'tasks') => void;
  onOpenTransactions?: () => void;
}

export const TodayOverview: React.FC<TodayOverviewProps> = ({
  pendingTasksCount,
  billsDueSoonCount,
  todayTransactionsCount,
  userRole = 'MEMBER',
  onSelectTab,
  onOpenTransactions,
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const canViewFinancials = canViewHouseholdFinancials(userRole);

  const handleTaskClick = () => {
    navigate('/tasks?status=pending');
  };

  const handleBillClick = () => {
    navigate('/bills?filter=due-soon');
  };

  const handleTransactionClick = () => {
    if (canViewFinancials) {
      if (onOpenTransactions) {
        onOpenTransactions();
      } else {
        navigate('/expenses');
      }
    } else {
      navigate('/groceries');
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
      className="p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-sm"
      aria-label="Today At A Glance"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('dash.todayOverview', 'Today at a glance')}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">Real-time household status</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-3">
        {/* 1. Pending Tasks Action Card (Violet / Sky) */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleTaskClick}
          onKeyDown={(e) => handleKeyDown(e, handleTaskClick)}
          aria-label={`${pendingTasksCount} tasks pending.`}
          className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-violet-500/[0.08] via-purple-500/[0.04] to-transparent dark:from-violet-500/[0.14] dark:via-purple-950/20 dark:to-transparent hover:from-violet-500/15 border border-violet-500/30 dark:border-violet-500/35 hover:border-violet-500/55 active:scale-[0.99] transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors shadow-2xs ${
                pendingTasksCount > 0
                  ? 'bg-violet-500/20 text-violet-700 dark:text-violet-300 group-hover:bg-violet-600 group-hover:text-white'
                  : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-400'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-violet-950 dark:text-violet-100 block truncate group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                {pendingTasksCount} {t('dash.tasksPending', 'Tasks Pending')}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                {pendingTasksCount > 0 ? 'Assigned household chores' : 'All chores completed'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-violet-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>

        {/* 2. Bills Due Soon Action Card (Amber / Orange) */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleBillClick}
          onKeyDown={(e) => handleKeyDown(e, handleBillClick)}
          aria-label={`${billsDueSoonCount} bills due soon.`}
          className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-transparent dark:from-amber-500/[0.14] dark:via-orange-950/20 dark:to-transparent hover:from-amber-500/15 border border-amber-500/30 dark:border-amber-500/35 hover:border-amber-500/55 active:scale-[0.99] transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors shadow-2xs ${
                billsDueSoonCount > 0
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 group-hover:bg-amber-600 group-hover:text-white'
                  : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-400'
              }`}
            >
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-amber-950 dark:text-amber-100 block truncate group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                {billsDueSoonCount} {t('dash.billsDueSoon', 'Bills Due Soon')}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                {billsDueSoonCount > 0 ? 'Upcoming utility bills' : 'Zero overdue payments'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>

        {/* 3. Role-Aware Card: Financial Transactions (Owner/Co-Owner) OR Groceries (Member) */}
        {canViewFinancials ? (
          <div
            role="button"
            tabIndex={0}
            onClick={handleTransactionClick}
            onKeyDown={(e) => handleKeyDown(e, handleTransactionClick)}
            aria-label={`${todayTransactionsCount} transactions today.`}
            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-blue-500/[0.08] via-sky-500/[0.04] to-transparent dark:from-blue-500/[0.14] dark:via-sky-950/20 dark:to-transparent hover:from-blue-500/15 border border-blue-500/30 dark:border-blue-500/35 hover:border-blue-500/55 active:scale-[0.99] transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors shadow-2xs ${
                  todayTransactionsCount > 0
                    ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 group-hover:bg-blue-600 group-hover:text-white'
                    : 'bg-slate-200/50 dark:bg-slate-700/50 text-slate-400'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-blue-950 dark:text-blue-100 block truncate group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                  {todayTransactionsCount} {t('dash.todayTransactions', 'Transactions Today')}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                  {todayTransactionsCount > 0 ? 'Click to inspect activity' : 'Click to view ledger'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/groceries')}
            onKeyDown={(e) => handleKeyDown(e, () => navigate('/groceries'))}
            aria-label="Shared Groceries"
            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-emerald-500/[0.08] via-teal-500/[0.04] to-transparent dark:from-emerald-500/[0.14] dark:via-teal-950/20 dark:to-transparent hover:from-emerald-500/15 border border-emerald-500/30 dark:border-emerald-500/35 hover:border-emerald-500/55 active:scale-[0.99] transition-all cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-2xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-100 block truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                  {t('dash.sharedGroceries', 'Shared Groceries')}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate font-medium">
                  {t('dash.sharedGroceriesDesc', 'Pantry & shopping list')}
                </span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>
        )}
      </div>
    </section>
  );
};

export default TodayOverview;
