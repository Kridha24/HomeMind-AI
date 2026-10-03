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
      className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs"
      aria-label="Today At A Glance"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('dash.todayOverview', 'Today at a glance')}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time household status</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-2.5">
        {/* 1. Pending Tasks Action Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleTaskClick}
          onKeyDown={(e) => handleKeyDown(e, handleTaskClick)}
          aria-label={`${pendingTasksCount} tasks pending.`}
          className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-purple-500/5 dark:hover:bg-purple-500/10 border border-slate-200/70 dark:border-slate-700/70 hover:border-purple-400 dark:hover:border-purple-500 active:scale-[0.99] transition-all cursor-pointer group"
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
                {pendingTasksCount} {t('dash.tasksPending', 'Tasks Pending')}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {pendingTasksCount > 0 ? 'Assigned household chores' : 'All chores completed'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>

        {/* 2. Bills Due Soon Action Card */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleBillClick}
          onKeyDown={(e) => handleKeyDown(e, handleBillClick)}
          aria-label={`${billsDueSoonCount} bills due soon.`}
          className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 border border-slate-200/70 dark:border-slate-700/70 hover:border-amber-400 dark:hover:border-amber-500 active:scale-[0.99] transition-all cursor-pointer group"
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
                {billsDueSoonCount} {t('dash.billsDueSoon', 'Bills Due Soon')}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {billsDueSoonCount > 0 ? 'Inspect upcoming obligations' : 'Zero overdue payments'}
              </span>
            </div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>

        {/* 3. Role-Aware Card: Financial Transactions (Owner/Co-Owner) OR Groceries (Member) */}
        {canViewFinancials ? (
          <div
            role="button"
            tabIndex={0}
            onClick={handleTransactionClick}
            onKeyDown={(e) => handleKeyDown(e, handleTransactionClick)}
            aria-label={`${todayTransactionsCount} transactions today.`}
            className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-blue-500/5 dark:hover:bg-blue-500/10 border border-slate-200/70 dark:border-slate-700/70 hover:border-blue-400 dark:hover:border-blue-500 active:scale-[0.99] transition-all cursor-pointer group"
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
                  {todayTransactionsCount} {t('dash.todayTransactions', 'Transactions Today')}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {todayTransactionsCount > 0 ? 'Click to inspect activity' : 'Click to view ledger'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/groceries')}
            onKeyDown={(e) => handleKeyDown(e, () => navigate('/groceries'))}
            aria-label="Shared Groceries"
            className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 border border-slate-200/70 dark:border-slate-700/70 hover:border-emerald-400 dark:hover:border-emerald-500 active:scale-[0.99] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/25 transition-colors">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                  {t('dash.sharedGroceries', 'Shared Groceries')}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {t('dash.sharedGroceriesDesc', 'Pantry & shopping list')}
                </span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>
        )}
      </div>
    </section>
  );
};

export default TodayOverview;
