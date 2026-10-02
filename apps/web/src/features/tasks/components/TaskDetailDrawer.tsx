import React, { useEffect } from 'react';
import {
  X,
  Calendar,
  User as UserIcon,
  Repeat,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Task, HouseholdMember } from '../../../types';
import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskStatusBadge } from './TaskStatusBadge';
import { getDueDateStatus, inferTaskCategory } from '../utils/taskFormatters';
import { useSettingStore } from '../../../stores/useSettingStore';

interface TaskDetailDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  members: HouseholdMember[];
  onToggleStatus: (taskId: string, currentStatus: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  isMutating?: boolean;
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  isOpen,
  onClose,
  members,
  onToggleStatus,
  onEdit,
  onDelete,
  isMutating = false,
}) => {
  const { reducedMotion } = useSettingStore();

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const isCompleted = task.status === 'COMPLETED';
  const dueStatus = getDueDateStatus(task.dueDate);
  const category = inferTaskCategory(task.title, task.description);
  const CategoryIcon = category.icon;
  const assignee = members.find((m) => m.id === task.assigneeId);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-background/70 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div
          className={`pointer-events-auto w-screen max-w-md bg-panel border-l border-primary/80 shadow-2xl flex flex-col justify-between ${
            reducedMotion ? '' : 'animate-in slide-in-from-right duration-200'
          }`}
        >
          {/* Header */}
          <div className="p-6 border-b border-primary/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TaskStatusBadge status={task.status} />
              <TaskPriorityBadge priority={task.priority} />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-secondary/70 transition-colors"
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Title & Category */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${category.color}`}
                >
                  <CategoryIcon className="w-3.5 h-3.5" />
                  <span>{category.name}</span>
                </span>
                {task.isRecurring && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">
                    <Repeat className="w-3 h-3" />
                    <span>Recurring Schedule</span>
                  </span>
                )}
              </div>

              <h2
                className={`text-xl font-bold text-primary break-words ${
                  isCompleted ? 'line-through text-muted' : ''
                }`}
              >
                {task.title}
              </h2>

              {task.description ? (
                <div className="p-3.5 rounded-2xl bg-secondary/40 border border-primary/50 text-xs sm:text-sm text-secondary whitespace-pre-wrap leading-relaxed">
                  {task.description}
                </div>
              ) : (
                <p className="text-xs text-muted italic">No extra notes or instructions provided.</p>
              )}
            </div>

            {/* Details Grid */}
            <div className="divide-y divide-primary/50 border-y border-primary/50 py-1 text-xs">
              {/* Due Date */}
              <div className="py-3 flex items-center justify-between">
                <span className="text-secondary font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span>Due Date</span>
                </span>
                <span
                  className={`font-semibold px-2.5 py-1 rounded-xl border ${
                    dueStatus.isOverdue && !isCompleted
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      : dueStatus.isToday && !isCompleted
                      ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                      : 'bg-secondary/60 text-primary border-primary/60'
                  }`}
                >
                  {dueStatus.label}
                  {task.dueDate && ` (${new Date(task.dueDate).toLocaleDateString()})`}
                </span>
              </div>

              {/* Assignee */}
              <div className="py-3 flex items-center justify-between">
                <span className="text-secondary font-medium flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-blue-500" />
                  <span>Assigned Member</span>
                </span>
                <span className="font-semibold text-primary">
                  {assignee ? assignee.name : 'Unassigned'}
                </span>
              </div>

              {/* Created By */}
              {task.creator?.name && (
                <div className="py-3 flex items-center justify-between">
                  <span className="text-secondary font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Created By</span>
                  </span>
                  <span className="font-medium text-secondary">{task.creator.name}</span>
                </div>
              )}

              {/* Created Date */}
              {task.createdAt && (
                <div className="py-3 flex items-center justify-between">
                  <span className="text-secondary font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Created Date</span>
                  </span>
                  <span className="text-muted">
                    {new Date(task.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {/* Completed / Updated Date */}
              {isCompleted && task.updatedAt && (
                <div className="py-3 flex items-center justify-between">
                  <span className="text-secondary font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Completed At</span>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {new Date(task.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-primary/60 bg-secondary/20 space-y-3">
            {/* Primary Status Button (Complete or Reopen) */}
            <button
              type="button"
              disabled={isMutating}
              onClick={() => onToggleStatus(task.id, task.status)}
              className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 ${
                isCompleted
                  ? 'bg-secondary border border-primary text-secondary hover:text-primary'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {isCompleted ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Reopen Task (Mark Incomplete)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Task Completed</span>
                </>
              )}
            </button>

            {/* Secondary Actions (Edit & Delete) */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="py-2.5 rounded-xl border border-primary/80 bg-panel text-secondary hover:text-primary hover:bg-secondary/60 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Task</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(task)}
                className="py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
