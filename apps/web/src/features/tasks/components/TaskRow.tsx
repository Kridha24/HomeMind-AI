import React from 'react';
import {
  Check,
  Calendar,
  User as UserIcon,
  Repeat,
  MoreVertical,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Task, HouseholdMember } from '../../../types';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { getDueDateStatus, inferTaskCategory } from '../utils/taskFormatters';
import { useSettingStore } from '../../../stores/useSettingStore';

interface TaskRowProps {
  task: Task;
  members: HouseholdMember[];
  currentUserId?: string;
  onToggleStatus: (taskId: string, currentStatus: string) => void;
  onSelectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  isMutating?: boolean;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  members,
  currentUserId,
  onToggleStatus,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  isMutating = false,
}) => {
  const { reducedMotion, compactMode } = useSettingStore();
  const isCompleted = task.status === 'COMPLETED';
  const dueStatus = getDueDateStatus(task.dueDate);
  const category = inferTaskCategory(task.title, task.description);
  const CategoryIcon = category.icon;

  // Find assignee
  const assignee = members.find((m) => m.id === task.assigneeId);
  const isAssignedToMe = currentUserId && task.assigneeId === currentUserId;

  return (
    <div
      onClick={() => onSelectTask(task)}
      className={`group flex items-center justify-between gap-3.5 px-4 ${
        compactMode ? 'py-2.5' : 'py-3.5'
      } rounded-2xl bg-panel border transition-all duration-200 cursor-pointer ${
        isCompleted
          ? 'border-primary/50 opacity-60 bg-secondary/30'
          : dueStatus.isOverdue
          ? 'border-rose-500/40 bg-rose-500/[0.02] hover:border-rose-500/60 shadow-xs'
          : 'border-primary/80 hover:border-purple-500/40 hover:bg-secondary/40 shadow-xs'
      }`}
    >
      {/* Left: Checkbox + Title + Category + Recurrence */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Accessible Checkbox */}
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
          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
            reducedMotion ? '' : 'duration-150 active:scale-90'
          } ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-slate-300 dark:border-slate-600 hover:border-purple-500 dark:hover:border-purple-400 bg-secondary/60'
          }`}
        >
          {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Title & Tags */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-sm font-semibold text-primary truncate ${
                isCompleted ? 'line-through text-muted' : ''
              }`}
            >
              {task.title}
            </span>

            {/* Recurrence Pill */}
            {task.isRecurring && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                title="Recurring task"
              >
                <Repeat className="w-2.5 h-2.5" />
                <span>Recurring</span>
              </span>
            )}

            {/* Category Tag */}
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${category.color}`}
            >
              <CategoryIcon className="w-2.5 h-2.5" />
              <span>{category.name}</span>
            </span>
          </div>

          {/* Description snippet if any */}
          {task.description && (
            <p className="text-xs text-secondary truncate max-w-xl">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Middle/Right: Priority, Due Date, Assignee, Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Priority Badge */}
        <TaskPriorityBadge priority={task.priority} />

        {/* Due Date Indicator */}
        <div
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-xl border ${
            dueStatus.isOverdue && !isCompleted
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
              : dueStatus.isToday && !isCompleted
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 font-bold'
              : 'bg-secondary/60 text-secondary border-primary/60'
          }`}
          title={task.dueDate ? `Due date: ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{dueStatus.label}</span>
        </div>

        {/* Assignee Avatar / Name */}
        <div
          className={`hidden md:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl border ${
            isAssignedToMe
              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-semibold'
              : 'bg-secondary/60 text-secondary border-primary/60'
          }`}
          title={assignee ? `Assigned to ${assignee.name}` : 'Unassigned'}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span className="truncate max-w-[100px]">
            {isAssignedToMe ? 'You' : assignee ? assignee.name : 'Unassigned'}
          </span>
        </div>

        {/* Quick Actions (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditTask(task);
            }}
            className="p-1.5 rounded-lg text-secondary hover:text-purple-600 hover:bg-secondary/80 transition-colors"
            title="Edit task"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task);
            }}
            className="p-1.5 rounded-lg text-secondary hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
