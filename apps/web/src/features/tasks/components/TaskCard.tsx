import React from 'react';
import { Check, Calendar, User as UserIcon, Repeat, Sparkles } from 'lucide-react';
import { Task, HouseholdMember } from '../../../types';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { getDueDateStatus, inferTaskCategory } from '../utils/taskFormatters';
import { useSettingStore } from '../../../stores/useSettingStore';

interface TaskCardProps {
  task: Task;
  members: HouseholdMember[];
  currentUserId?: string;
  onToggleStatus: (taskId: string, currentStatus: string) => void;
  onSelectTask: (task: Task) => void;
  isMutating?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  members,
  currentUserId,
  onToggleStatus,
  onSelectTask,
  isMutating = false,
}) => {
  const { reducedMotion } = useSettingStore();
  const isCompleted = task.status === 'COMPLETED';
  const dueStatus = getDueDateStatus(task.dueDate);
  const category = inferTaskCategory(task.title, task.description);
  const CategoryIcon = category.icon;

  const assignee = members.find((m) => m.id === task.assigneeId);
  const isAssignedToMe = currentUserId && task.assigneeId === currentUserId;

  return (
    <div
      onClick={() => onSelectTask(task)}
      className={`p-4 rounded-2xl bg-panel border transition-all duration-200 cursor-pointer space-y-3 ${
        isCompleted
          ? 'border-primary/50 opacity-60 bg-secondary/30'
          : dueStatus.isOverdue
          ? 'border-rose-500/40 bg-rose-500/[0.02] active:border-rose-500/60 shadow-xs'
          : 'border-primary/80 active:border-purple-500/40 active:bg-secondary/40 shadow-xs'
      }`}
    >
      {/* Top: Checkbox, Title, Priority */}
      <div className="flex items-start gap-3">
        {/* Min 44x44px touch area for checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={isCompleted}
          aria-label={isCompleted ? `Mark ${task.title} as incomplete` : `Mark ${task.title} as complete`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus(task.id, task.status);
          }}
          disabled={isMutating}
          className="min-w-[44px] min-h-[44px] -m-2.5 flex items-center justify-center focus:outline-none"
        >
          <div
            className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
              reducedMotion ? '' : 'duration-150 active:scale-90'
            } ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-300 dark:border-slate-600 bg-secondary/60'
            }`}
          >
            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </button>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`text-sm font-semibold text-primary break-words leading-tight ${
                isCompleted ? 'line-through text-muted' : ''
              }`}
            >
              {task.title}
            </h4>
            <TaskPriorityBadge priority={task.priority} className="flex-shrink-0" />
          </div>

          {task.description && (
            <p className="text-xs text-secondary mt-1 line-clamp-2">{task.description}</p>
          )}
        </div>
      </div>

      {/* Bottom Metadata: Due date, Assignee, Category */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-primary/40 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Due date */}
          <span
            className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-lg border text-[11px] ${
              dueStatus.isOverdue && !isCompleted
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                : dueStatus.isToday && !isCompleted
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25 font-bold'
                : 'bg-secondary/60 text-secondary border-primary/50'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>{dueStatus.label}</span>
          </span>

          {/* Recurrence */}
          {task.isRecurring && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded-md">
              <Repeat className="w-2.5 h-2.5" />
              <span>Recurring</span>
            </span>
          )}
        </div>

        {/* Assignee */}
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border ${
            isAssignedToMe
              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25'
              : 'bg-secondary/60 text-secondary border-primary/50'
          }`}
        >
          <UserIcon className="w-3 h-3" />
          <span>{isAssignedToMe ? 'Assigned to you' : assignee ? assignee.name : 'Unassigned'}</span>
        </span>
      </div>
    </div>
  );
};
