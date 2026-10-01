import React from 'react';
import { History, TrendingUp, TrendingDown, ArrowRight, Wallet, CreditCard } from 'lucide-react';
import { formatRelativeTime } from './utils/dashboardUtils';

interface ActivityItem {
  id: string;
  title: string;
  amount: number;
  category?: string;
  date: string;
  type?: 'INCOME' | 'EXPENSE' | string;
  userName?: string;
}

interface RecentActivityCardProps {
  items: ActivityItem[];
  format: (amount: number) => string;
  onViewAll?: () => void;
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  items,
  format,
  onViewAll,
}) => {
  return (
    <section
      className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3.5"
      aria-label="Recent Household Activity"
    >
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <History className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
              Recent Activity
            </h3>
            <p className="text-[10px] text-slate-400">Latest financial & ledger records</p>
          </div>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 active:scale-95 transition-transform"
          >
            <span>View Ledger</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {items.length > 0 ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {items.slice(0, 5).map((item) => {
            const isIncome = item.type === 'INCOME';
            return (
              <div
                key={item.id}
                className="py-2.5 px-1 sm:px-2 flex items-center justify-between gap-3 group hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isIncome ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="truncate max-w-[90px]">{item.category || item.type}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(item.date)}</span>
                      {item.userName && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[80px] font-medium text-slate-500">
                            {item.userName.split(' ')[0]}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-xs sm:text-sm font-extrabold font-mono block ${
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {isIncome ? `+${format(item.amount)}` : `-${format(item.amount)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center space-y-1">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            No activity recorded yet
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Log your daily expenses, bills, or income to build your household ledger timeline.
          </p>
        </div>
      )}
    </section>
  );
};
