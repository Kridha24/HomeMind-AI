import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useSettingStore } from '../../../stores/useSettingStore';

interface TasksProgressProps {
  completedCount: number;
  totalCount: number;
}

export const TasksProgress: React.FC<TasksProgressProps> = ({ completedCount, totalCount }) => {
  const { reducedMotion } = useSettingStore();

  if (totalCount === 0) return null;

  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-panel border border-primary/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-primary block">
            Weekly Chore Completion
          </span>
          <span className="text-[11px] text-secondary">
            {completedCount} of {totalCount} tasks completed ({percentage}%)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full sm:w-48 bg-secondary/80 rounded-full h-2 overflow-hidden border border-primary/40">
        <div
          className={`bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full ${
            reducedMotion ? '' : 'transition-all duration-300'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
};
