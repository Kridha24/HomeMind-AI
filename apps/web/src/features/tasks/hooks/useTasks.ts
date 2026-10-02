import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../services/apiClient';
import { socketService } from '../../../services/socketService';
import { Task, HouseholdMember } from '../../../types';
import { useAuthStore } from '../../../stores/useAuthStore';

export function useTasks() {
  const queryClient = useQueryClient();
  const { household, user } = useAuthStore();
  const householdId = household?.id || 'default';

  // 1. React Query Fetch Tasks (Strictly household scoped)
  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Task[]>({
    queryKey: ['tasks', householdId],
    queryFn: async () => {
      const res = await apiClient.get('/tasks');
      const list = Array.isArray(res.data) ? res.data : res.data?.tasks || [];
      return list;
    },
    staleTime: 1000 * 20, // 20 seconds fresh
    enabled: Boolean(householdId),
  });

  // 2. Fetch Real Household Members for Assignment
  const { data: members = [] } = useQuery<HouseholdMember[]>({
    queryKey: ['householdMembers', householdId],
    queryFn: async () => {
      const res = await apiClient.get('/family/members');
      if (res.data?.household?.members) {
        return res.data.household.members;
      }
      if (Array.isArray(res.data?.members)) {
        return res.data.members;
      }
      return [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: Boolean(householdId),
  });

  // 3. Real-time synchronization via Socket.IO
  useEffect(() => {
    if (!householdId) return;
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', householdId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary', householdId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', householdId] });
    };

    socket.on('task_updated', handleUpdate);

    return () => {
      socket.off('task_updated', handleUpdate);
    };
  }, [householdId, queryClient]);

  // Helper to invalidate all related queries
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', householdId] });
    queryClient.invalidateQueries({ queryKey: ['dashboardSummary', householdId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', householdId] });
  };

  // 4. Mutation: Toggle Task Status (Optimistic UI with Rollback)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ taskId, nextStatus }: { taskId: string; nextStatus: 'PENDING' | 'COMPLETED' }) => {
      const res = await apiClient.put(`/tasks/${taskId}/status`, { status: nextStatus });
      return res.data?.task || res.data;
    },
    onMutate: async ({ taskId, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', householdId] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', householdId]) || [];

      // Optimistically update status
      queryClient.setQueryData<Task[]>(['tasks', householdId], (old = []) =>
        old.map((t) => (t.id === taskId ? { ...t, status: nextStatus, updatedAt: new Date().toISOString() } : t))
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', householdId], context.previousTasks);
      }
    },
    onSettled: () => {
      invalidateAll();
    },
  });

  // 5. Mutation: Add Task
  const addMutation = useMutation({
    mutationFn: async (newTask: {
      title: string;
      description?: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      dueDate: string;
      assigneeId?: string | null;
      isRecurring?: boolean;
    }) => {
      const res = await apiClient.post('/tasks', newTask);
      return res.data?.task || res.data;
    },
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', householdId] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', householdId]) || [];

      const optimisticTask: Task = {
        id: 'temp-' + Date.now(),
        householdId,
        title: newTask.title,
        description: newTask.description || undefined,
        priority: newTask.priority || 'MEDIUM',
        status: 'PENDING',
        dueDate: newTask.dueDate,
        isRecurring: Boolean(newTask.isRecurring),
        assigneeId: newTask.assigneeId || null,
        creatorId: user?.id,
        creator: user ? { id: user.id, name: user.name, email: user.email } : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Task[]>(['tasks', householdId], [optimisticTask, ...previousTasks]);

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', householdId], context.previousTasks);
      }
    },
    onSettled: () => {
      invalidateAll();
    },
  });

  // 6. Mutation: Edit Task
  const editMutation = useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<{
        title: string;
        description: string;
        priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
        dueDate: string;
        assigneeId: string | null;
        isRecurring: boolean;
        status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
      }>;
    }) => {
      const res = await apiClient.put(`/tasks/${taskId}`, updates);
      return res.data?.task || res.data;
    },
    onMutate: async ({ taskId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', householdId] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', householdId]) || [];

      queryClient.setQueryData<Task[]>(['tasks', householdId], (old = []) =>
        old.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', householdId], context.previousTasks);
      }
    },
    onSettled: () => {
      invalidateAll();
    },
  });

  // 7. Mutation: Delete Task
  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await apiClient.delete(`/tasks/${taskId}`);
      return taskId;
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', householdId] });
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', householdId]) || [];

      queryClient.setQueryData<Task[]>(['tasks', householdId], (old = []) =>
        old.filter((t) => t.id !== taskId)
      );

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', householdId], context.previousTasks);
      }
    },
    onSettled: () => {
      invalidateAll();
    },
  });

  return {
    tasks,
    members,
    isLoading,
    isError,
    error,
    refetch,
    toggleStatusMutation,
    addMutation,
    editMutation,
    deleteMutation,
  };
}
