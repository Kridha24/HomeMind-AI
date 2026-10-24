import React from 'react';
import { Calendar, Clock, ListChecks, CheckCircle2, UserCheck } from 'lucide-react';
import { TaskTab } from '../hooks/useTaskFilters';
import { TaskSummaryMetrics } from '../hooks/useTaskSummary';

interface TasksTabsProps {
  activeTab: TaskTab;
  onTabChange: (tab: TaskTab) => void;
  metrics: TaskSummaryMetrics;
  hasAssigneeSupport?: boolean;
}

export const TasksTabs: React.FC<TasksTabsProps> = ({
  activeTab,
  onTabChange,
  metrics,
  hasAssigneeSupport = true,
}) => {
  const safeMetrics = metrics || {
    todoCount: 0,
    dueTodayCount: 0,
    overdueCount: 0,
    completedThisWeekCount: 0,
    assignedToMeCount: 0,
    memberWorkload: [],
  };

  const tabs = [
    {
      id: 'today' as TaskTab,
      label: 'Today',
      icon: Calendar,
      count: (safeMetrics.dueTodayCount || 0) + (safeMetrics.overdueCount || 0),
    },
    {
      id: 'upcoming' as TaskTab,
      label: 'Upcoming',
      icon: Clock,
      count: Math.max(0, (safeMetrics.todoCount || 0) - (safeMetrics.dueTodayCount || 0) - (safeMetrics.overdueCount || 0)),
    },
    {
      id: 'all' as TaskTab,
      label: 'All Tasks',
      icon: ListChecks,
      count: safeMetrics.todoCount || 0,
    },
    {
      id: 'completed' as TaskTab,
      label: 'Completed',
      icon: CheckCircle2,
      count: safeMetrics.completedThisWeekCount || 0,
    },
  ];

  if (hasAssigneeSupport) {
    tabs.push({
      id: 'assigned-me' as TaskTab,
      label: 'Assigned to Me',
      icon: UserCheck,
      count: safeMetrics.assignedToMeCount || 0,
    });
  }

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-primary/60">
      {(Array.isArray(tabs) ? tabs : []).map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              isActive
                ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 shadow-xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0 text-sky-500" />
            <span>{tab.label}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isActive
                  ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 font-extrabold'
                  : 'bg-secondary text-muted'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
