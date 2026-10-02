import { AlertOctagon, AlertTriangle, ArrowUp, Minus, ArrowDown, CheckCircle2, Clock, CircleDot, XCircle } from 'lucide-react';
import React from 'react';
import { Task } from '../../../types';
import { getDueDateStatus } from './taskFormatters';

export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface PriorityConfig {
  value: TaskPriority;
  label: string;
  color: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  weight: number;
  icon: React.ComponentType<{ className?: string }>;
}

export const PRIORITY_CONFIGS: Record<TaskPriority, PriorityConfig> = {
  URGENT: {
    value: 'URGENT',
    label: 'Urgent',
    color: 'rose',
    badgeBg: 'bg-rose-500/10 dark:bg-rose-500/15',
    textColor: 'text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-500/25 dark:border-rose-500/30',
    weight: 4,
    icon: AlertOctagon,
  },
  HIGH: {
    value: 'HIGH',
    label: 'High',
    color: 'rose',
    badgeBg: 'bg-rose-500/10 dark:bg-rose-500/15',
    textColor: 'text-rose-600 dark:text-rose-400',
    borderColor: 'border-rose-500/25 dark:border-rose-500/30',
    weight: 3,
    icon: AlertTriangle,
  },
  MEDIUM: {
    value: 'MEDIUM',
    label: 'Medium',
    color: 'amber',
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/25 dark:border-amber-500/30',
    weight: 2,
    icon: Minus,
  },
  LOW: {
    value: 'LOW',
    label: 'Low',
    color: 'blue',
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/15',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/25 dark:border-blue-500/30',
    weight: 1,
    icon: ArrowDown,
  },
};

export interface StatusConfig {
  value: TaskStatus;
  label: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const STATUS_CONFIGS: Record<TaskStatus, StatusConfig> = {
  PENDING: {
    value: 'PENDING',
    label: 'To Do',
    badgeBg: 'bg-slate-500/10 dark:bg-slate-500/15',
    textColor: 'text-slate-600 dark:text-slate-300',
    borderColor: 'border-slate-500/20 dark:border-slate-500/30',
    icon: Clock,
  },
  IN_PROGRESS: {
    value: 'IN_PROGRESS',
    label: 'In Progress',
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/15',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/25 dark:border-blue-500/30',
    icon: CircleDot,
  },
  COMPLETED: {
    value: 'COMPLETED',
    label: 'Completed',
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500/25 dark:border-emerald-500/30',
    icon: CheckCircle2,
  },
  CANCELLED: {
    value: 'CANCELLED',
    label: 'Cancelled',
    badgeBg: 'bg-slate-500/10 dark:bg-slate-500/15',
    textColor: 'text-slate-400 dark:text-slate-500',
    borderColor: 'border-slate-500/20 dark:border-slate-500/25',
    icon: XCircle,
  },
};

/**
 * Sort tasks:
 * Open tasks: Overdue first, then soonest due date, then priority tie-break.
 * Completed tasks: Most recently completed or updated first.
 */
export function sortTasks(tasks: Task[], sortBy: 'dueDate' | 'priority' | 'created' | 'completed' = 'dueDate'): Task[] {
  return [...tasks].sort((a, b) => {
    // If one is completed and one is not, put uncompleted first unless sorting by completed
    if (sortBy !== 'completed') {
      const aDone = a.status === 'COMPLETED';
      const bDone = b.status === 'COMPLETED';
      if (aDone !== bDone) {
        return aDone ? 1 : -1;
      }
    }

    if (sortBy === 'priority') {
      const weightA = PRIORITY_CONFIGS[a.priority as TaskPriority]?.weight || 1;
      const weightB = PRIORITY_CONFIGS[b.priority as TaskPriority]?.weight || 1;
      if (weightA !== weightB) return weightB - weightA;
    }

    if (sortBy === 'completed') {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    }

    if (sortBy === 'created') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }

    // Default: Due date (overdue first, then soonest due, then no due date last)
    const statusA = getDueDateStatus(a.dueDate);
    const statusB = getDueDateStatus(b.dueDate);

    // Overdue items come first
    if (statusA.isOverdue && !statusB.isOverdue) return -1;
    if (!statusA.isOverdue && statusB.isOverdue) return 1;

    // Both overdue: most overdue first (lowest daysDifference)
    if (statusA.isOverdue && statusB.isOverdue) {
      return statusA.daysDifference - statusB.daysDifference;
    }

    // Compare actual daysDifference
    if (statusA.daysDifference !== statusB.daysDifference) {
      return statusA.daysDifference - statusB.daysDifference;
    }

    // Priority tie-break
    const weightA = PRIORITY_CONFIGS[a.priority as TaskPriority]?.weight || 1;
    const weightB = PRIORITY_CONFIGS[b.priority as TaskPriority]?.weight || 1;
    return weightB - weightA;
  });
}
