import React from 'react';
import { Users, CheckSquare, ShoppingBasket, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HouseholdSummaryProps {
  memberCount: number;
  pendingTasksCount: number;
  neededGroceriesCount: number;
  unpaidBillsCount: number;
}

export const HouseholdSummary: React.FC<HouseholdSummaryProps> = ({
  memberCount,
  pendingTasksCount,
  neededGroceriesCount,
  unpaidBillsCount,
}) => {
  const navigate = useNavigate();

  const cards = [
    {
      label: 'Family Members',
      count: memberCount,
      icon: Users,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white',
      container: 'border-indigo-500/30 dark:border-indigo-500/35 bg-gradient-to-br from-indigo-500/[0.08] via-indigo-500/[0.02] to-white dark:from-indigo-500/[0.14] dark:via-indigo-950/20 dark:to-slate-900',
      gradient: 'from-indigo-500 via-purple-500 to-blue-400',
      action: () => {},
    },
    {
      label: 'Pending Chores',
      count: pendingTasksCount,
      icon: CheckSquare,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 group-hover:bg-sky-600 group-hover:text-white',
      container: 'border-sky-500/30 dark:border-sky-500/35 bg-gradient-to-br from-sky-500/[0.08] via-sky-500/[0.02] to-white dark:from-sky-500/[0.14] dark:via-sky-950/20 dark:to-slate-900',
      gradient: 'from-sky-500 via-blue-500 to-indigo-400',
      action: () => navigate('/tasks?status=pending'),
    },
    {
      label: 'Groceries to Buy',
      count: neededGroceriesCount,
      icon: ShoppingBasket,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 group-hover:bg-rose-600 group-hover:text-white',
      container: 'border-rose-500/30 dark:border-rose-500/35 bg-gradient-to-br from-rose-500/[0.08] via-rose-500/[0.02] to-white dark:from-rose-500/[0.14] dark:via-rose-950/20 dark:to-slate-900',
      gradient: 'from-rose-500 via-pink-500 to-rose-400',
      action: () => navigate('/groceries'),
    },
    {
      label: 'Bills Due',
      count: unpaidBillsCount,
      icon: FileText,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 group-hover:bg-amber-600 group-hover:text-white',
      container: 'border-amber-500/30 dark:border-amber-500/35 bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.02] to-white dark:from-amber-500/[0.14] dark:via-amber-950/20 dark:to-slate-900',
      gradient: 'from-amber-500 via-orange-400 to-amber-300',
      action: () => navigate('/bills?filter=unpaid'),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;

        return (
          <button
            key={idx}
            type="button"
            onClick={card.action}
            className={`group relative overflow-hidden p-4 rounded-2xl border text-left transition-all duration-200 hover:-translate-y-px shadow-xs hover:shadow-md flex items-center justify-between gap-3 ${card.container}`}
          >
            <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${card.gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{card.label}</span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono block">
                {card.count}
              </span>
            </div>

            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-2xs transition-colors ${card.bg}`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </button>
        );
      })}
    </div>
  );
};
