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
      secondaryText: memberCount === 1 ? '1 active member' : `${memberCount} active members`,
      icon: Users,
      badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
      gradient: 'from-violet-500 via-indigo-500 to-purple-400',
      action: () => {},
    },
    {
      label: 'Pending Chores',
      count: pendingTasksCount,
      secondaryText: pendingTasksCount === 0 ? 'All tasks completed' : 'Tasks to complete',
      icon: CheckSquare,
      badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      gradient: 'from-cyan-500 via-blue-500 to-indigo-400',
      action: () => navigate('/tasks?status=pending'),
    },
    {
      label: 'Groceries to Buy',
      count: neededGroceriesCount,
      secondaryText: neededGroceriesCount === 0 ? 'Pantry stocked' : 'Items needed',
      icon: ShoppingBasket,
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      gradient: 'from-rose-500 via-pink-500 to-rose-400',
      action: () => navigate('/groceries'),
    },
    {
      label: 'Bills Due',
      count: unpaidBillsCount,
      secondaryText: unpaidBillsCount === 0 ? 'All bills paid' : 'Awaiting payment',
      icon: FileText,
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
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
            className="group relative overflow-hidden p-4 rounded-2xl bg-panel border border-primary/80 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex items-center justify-between gap-3 shadow-2xs"
          >
            {/* Top Micro-Gradient Line */}
            <div
              className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r ${card.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}
            />

            <div className="space-y-1 min-w-0">
              <span className="text-xs font-semibold text-secondary block truncate">
                {card.label}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-primary font-mono block">
                {card.count}
              </span>
              <span className="text-[11px] text-muted block truncate font-medium">
                {card.secondaryText}
              </span>
            </div>

            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 shadow-2xs ${card.badgeColor}`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </button>
        );
      })}
    </div>
  );
};
