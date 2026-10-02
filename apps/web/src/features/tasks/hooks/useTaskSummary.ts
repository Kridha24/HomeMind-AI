import { useMemo } from 'react';
import { Task, HouseholdMember } from '../../../types';
import { useAuthStore } from '../../../stores/useAuthStore';
import { getDueDateStatus } from '../utils/taskFormatters';

export interface TaskSummaryMetrics {
  todoCount: number;
  dueTodayCount: number;
  overdueCount: number;
  completedThisWeekCount: number;
  assignedToMeCount: number;
  memberWorkload: Array<{
    memberId: string | null;
    name: string;
    count: number;
    avatarUrl?: string | null;
  }>;
}

export function useTaskSummary(tasks: Task[], members: HouseholdMember[] = []): TaskSummaryMetrics {
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  return useMemo(() => {
    let todoCount = 0;
    let dueTodayCount = 0;
    let overdueCount = 0;
    let completedThisWeekCount = 0;
    let assignedToMeCount = 0;

    const workloadMap: Record<string, { name: string; count: number; avatarUrl?: string | null }> = {
      unassigned: { name: 'Unassigned', count: 0, avatarUrl: null },
    };

    // Pre-populate members in workload map
    members.forEach((m) => {
      workloadMap[m.id] = {
        name: m.name,
        count: 0,
        avatarUrl: m.avatarUrl,
      };
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    tasks.forEach((task) => {
      const isCompleted = task.status === 'COMPLETED';
      const dueStatus = getDueDateStatus(task.dueDate, now);

      if (isCompleted) {
        // Check if completed this week (by updatedAt)
        const updatedTime = task.updatedAt ? new Date(task.updatedAt) : null;
        if (updatedTime && updatedTime >= sevenDaysAgo) {
          completedThisWeekCount++;
        } else if (!updatedTime) {
          completedThisWeekCount++;
        }
      } else {
        // Open task
        todoCount++;

        if (dueStatus.isToday) {
          dueTodayCount++;
        } else if (dueStatus.isOverdue) {
          overdueCount++;
        }

        // Assigned to current authenticated user
        if (currentUserId && task.assigneeId === currentUserId) {
          assignedToMeCount++;
        }

        // Workload tracking
        if (task.assigneeId && workloadMap[task.assigneeId]) {
          workloadMap[task.assigneeId].count++;
        } else {
          workloadMap.unassigned.count++;
        }
      }
    });

    const memberWorkload = Object.entries(workloadMap)
      .map(([id, data]) => ({
        memberId: id === 'unassigned' ? null : id,
        name: data.name,
        count: data.count,
        avatarUrl: data.avatarUrl,
      }))
      .filter((m) => m.count > 0 || m.memberId !== null);

    return {
      todoCount,
      dueTodayCount,
      overdueCount,
      completedThisWeekCount,
      assignedToMeCount,
      memberWorkload,
    };
  }, [tasks, members, currentUserId]);
}
