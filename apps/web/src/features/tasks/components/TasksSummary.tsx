import React from 'react';
import { CheckSquare, Calendar, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import { TaskSummaryMetrics } from '../hooks/useTaskSummary';
import { TaskTab } from '../hooks/useTaskFilters';

interface TasksSummaryProps {
  metrics: TaskSummaryMetrics;
  activeTab: TaskTab;
  onTabChange: (tab: TaskTab) => void;
}

export const TasksSummary: React.FC<TasksSummaryProps> = ({
  metrics,
  activeTab,
  onTabChange,
}) => {
  const cards = [
    {
      id: 'all' as TaskTab,
      label: 'To Do',
      count: metrics.todoCount,
      icon: CheckSquare,
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-500/12 dark:bg-sky-500/20',
      borderColor: 'border-sky-500/25 dark:border-sky-500/35',
      topBar: 'bg-gradient-to-r from-sky-500 to-blue-400',
      activeBorder: 'ring-2 ring-sky-500/50',
    },
    {
      id: 'today' as TaskTab,
      label: 'Due Today',
      count: metrics.dueTodayCount,
      icon: Calendar,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/12 dark:bg-amber-500/20',
      borderColor: 'border-amber-500/25 dark:border-amber-500/35',
      topBar: 'bg-gradient-to-r from-amber-500 to-orange-400',
      activeBorder: 'ring-2 ring-amber-500/50',
    },
    {
      id: 'today' as TaskTab,
      label: 'Overdue',
      count: metrics.overdueCount,
      icon: AlertCircle,
      color: metrics.overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400',
      bgColor: metrics.overdueCount > 0 ? 'bg-rose-500/15 dark:bg-rose-500/20' : 'bg-slate-500/10 dark:bg-slate-500/15',
      borderColor: metrics.overdueCount > 0 ? 'border-rose-500/30 dark:border-rose-500/40' : 'border-slate-500/20 dark:border-slate-500/30',
      topBar: 'bg-gradient-to-r from-rose-500 to-red-400',
      activeBorder: 'ring-2 ring-rose-500/50',
    },
    {
      id: 'completed' as TaskTab,
      label: 'Completed This Week',
      count: metrics.completedThisWeekCount,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/12 dark:bg-emerald-500/20',
      borderColor: 'border-emerald-500/25 dark:border-emerald-500/35',
      topBar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      activeBorder: 'ring-2 ring-emerald-500/50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const isActive = activeTab === card.id && (card.label !== 'Overdue' || metrics.overdueCount > 0);

        return (
          <button
            key={idx}
            type="button"
            onClick={() => onTabChange(card.id)}
            className={`p-3.5 sm:p-4 rounded-2xl bg-panel border text-left transition-all duration-150 hover:bg-secondary/40 shadow-xs flex items-center justify-between gap-3 relative overflow-hidden ${
              card.borderColor
            } ${isActive ? card.activeBorder : ''}`}
          >
            <div className={`h-[2.5px] w-full ${card.topBar} absolute top-0 left-0 right-0 opacity-80`} />
            <div className="space-y-1 pt-0.5">
              <span className={`text-xs font-bold block ${card.color}`}>
                {card.label}
              </span>
              <span className="text-xl sm:text-2xl font-black text-primary font-mono block">
                {card.count}
              </span>
            </div>

            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-transform group-hover:scale-105 ${card.bgColor} ${card.color} ${card.borderColor}`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </button>
        );
      })}
    </div>
  );
};
