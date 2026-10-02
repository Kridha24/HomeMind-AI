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
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10 dark:bg-blue-500/15',
      border: 'border-blue-500/20 dark:border-blue-500/30',
      action: () => {},
    },
    {
      label: 'Pending Chores',
      count: pendingTasksCount,
      icon: CheckSquare,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10 dark:bg-purple-500/15',
      border: 'border-purple-500/20 dark:border-purple-500/30',
      action: () => navigate('/tasks?status=pending'),
    },
    {
      label: 'Groceries to Buy',
      count: neededGroceriesCount,
      icon: ShoppingBasket,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      border: 'border-emerald-500/20 dark:border-emerald-500/30',
      action: () => navigate('/groceries'),
    },
    {
      label: 'Bills Due',
      count: unpaidBillsCount,
      icon: FileText,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      border: 'border-amber-500/20 dark:border-amber-500/30',
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
            className={`p-4 rounded-2xl bg-panel border text-left transition-all duration-150 hover:bg-secondary/40 shadow-xs flex items-center justify-between gap-3 ${card.border}`}
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold text-secondary block">{card.label}</span>
              <span className="text-xl sm:text-2xl font-black text-primary font-mono block">
                {card.count}
              </span>
            </div>

            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${card.bg} ${card.color} ${card.border}`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </button>
        );
      })}
    </div>
  );
};
