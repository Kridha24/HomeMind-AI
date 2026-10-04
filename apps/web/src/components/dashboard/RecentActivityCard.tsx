import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Tag,
} from 'lucide-react';
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

// Semantic category colors
const getCategoryChipStyle = (category?: string, isIncome?: boolean) => {
  if (isIncome) {
    return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
  }
  const cat = (category || '').toLowerCase();
  if (cat.includes('food') || cat.includes('dining') || cat.includes('grocery') || cat.includes('restaurant')) {
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
  }
  if (cat.includes('transport') || cat.includes('petrol') || cat.includes('fuel') || cat.includes('cab')) {
    return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
  }
  if (cat.includes('health') || cat.includes('med') || cat.includes('doctor')) {
    return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';
  }
  if (cat.includes('util') || cat.includes('bill') || cat.includes('electric') || cat.includes('water')) {
    return 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20';
  }
  if (cat.includes('shop') || cat.includes('cloth') || cat.includes('amazon')) {
    return 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20';
  }
  if (cat.includes('rent') || cat.includes('hous')) {
    return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20';
  }
  return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
};

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  items,
  format,
  onViewAll,
}) => {
  const navigate = useNavigate();

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate('/expenses');
    }
  };

  return (
    <section
      className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3.5"
      aria-label="Recent Household Transactions"
    >
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/20 shadow-2xs">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
              Recent Transactions
            </h3>
            <p className="text-[10px] text-slate-400">Live household ledger preview</p>
          </div>
        </div>

        <button
          onClick={handleViewAll}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 active:scale-95 transition-all group"
        >
          <span>View All Transactions</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {items.length > 0 ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
          {items.slice(0, 5).map((item) => {
            const isIncome = item.type === 'INCOME';
            const chipClass = getCategoryChipStyle(item.category, isIncome);
            const creator = item.userName ? item.userName.split(' ')[0] : 'Member';

            return (
              <div
                key={item.id}
                className="py-2.5 px-1 sm:px-2 flex items-center justify-between gap-3 group hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-all"
              >
                {/* Left: Icon + Title + Semantic Category + Creator + Time */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-2xs ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                    }`}
                  >
                    {isIncome ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                      {/* Semantic Category Chip */}
                      <span
                        className={`px-1.5 py-0.2 rounded-md font-semibold text-[9px] border uppercase tracking-wider ${chipClass}`}
                      >
                        {item.category || (isIncome ? 'Income' : 'Expense')}
                      </span>
                      <span>•</span>
                      <span>{formatRelativeTime(item.date)}</span>
                      <span>•</span>
                      {/* Created by / verified */}
                      <span className="flex items-center gap-0.5 font-medium text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                        <span>{creator}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount */}
                <div className="text-right flex-shrink-0 pl-2">
                  <span
                    className={`text-xs sm:text-sm font-black font-mono block ${
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
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
            No transactions recorded yet
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Log your daily expenses or income to build your household ledger timeline.
          </p>
        </div>
      )}
    </section>
  );
};
