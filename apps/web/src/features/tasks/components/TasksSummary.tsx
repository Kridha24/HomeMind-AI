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
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10 dark:bg-purple-500/15',
      borderColor: 'border-purple-500/20 dark:border-purple-500/30',
      activeBorder: 'ring-2 ring-purple-500/50',
    },
    {
      id: 'today' as TaskTab,
      label: 'Due Today',
      count: metrics.dueTodayCount,
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10 dark:bg-blue-500/15',
      borderColor: 'border-blue-500/20 dark:border-blue-500/30',
      activeBorder: 'ring-2 ring-blue-500/50',
    },
    {
      id: 'today' as TaskTab,
      label: 'Overdue',
      count: metrics.overdueCount,
      icon: AlertCircle,
      color: metrics.overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400',
      bgColor: metrics.overdueCount > 0 ? 'bg-rose-500/10 dark:bg-rose-500/15' : 'bg-slate-500/10 dark:bg-slate-500/15',
      borderColor: metrics.overdueCount > 0 ? 'border-rose-500/20 dark:border-rose-500/30' : 'border-slate-500/20 dark:border-slate-500/30',
      activeBorder: 'ring-2 ring-rose-500/50',
    },
    {
      id: 'completed' as TaskTab,
      label: 'Completed This Week',
      count: metrics.completedThisWeekCount,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      borderColor: 'border-emerald-500/20 dark:border-emerald-500/30',
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
            className={`p-3.5 sm:p-4 rounded-2xl bg-panel border text-left transition-all duration-150 hover:bg-secondary/40 shadow-xs flex items-center justify-between gap-3 ${
              card.borderColor
            } ${isActive ? card.activeBorder : ''}`}
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold text-secondary block">
                {card.label}
              </span>
              <span className="text-xl sm:text-2xl font-black text-primary font-mono block">
                {card.count}
              </span>
            </div>

            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${card.bgColor} ${card.color} ${card.borderColor}`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </button>
        );
      })}
    </div>
  );
};
