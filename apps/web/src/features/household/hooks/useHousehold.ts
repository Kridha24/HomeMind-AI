import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../services/apiClient';
import { socketService } from '../../../services/socketService';
import { HouseholdMember, Household, Task, GroceryItem, Bill, HouseholdActivity } from '../../../types';
import { useAuthStore } from '../../../stores/useAuthStore';

export interface AvailableHouseholdItem {
  id: string;
  name: string;
  inviteCode: string;
  role: string;
  memberCount: number;
  isCurrent: boolean;
}

export function useHousehold() {
  const queryClient = useQueryClient();
  const { household, user, updateHousehold, updateUser } = useAuthStore();
  const householdId = household?.id || 'default';
  const userId = user?.id;

  // 1. Fetch Household & Members
  const {
    data: membersData,
    isLoading: loadingMembers,
    isError: isMembersError,
    refetch: refetchMembers,
  } = useQuery<{ household: Household; members: HouseholdMember[] }>({
    queryKey: ['householdMembers', householdId],
    queryFn: async () => {
      const res = await apiClient.get('/family/members');
      return {
        household: res.data?.household || household,
        members: res.data?.household?.members || res.data?.members || [],
      };
    },
    staleTime: 1000 * 30, // 30 seconds
    enabled: Boolean(householdId),
  });

  const members = membersData?.members || [];
  const currentHousehold = membersData?.household || household;

  // 2. Fetch Real Household Activity Logs
  const {
    data: activity = [],
    isLoading: loadingActivity,
    refetch: refetchActivity,
  } = useQuery<HouseholdActivity[]>({
    queryKey: ['householdActivity', householdId],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/family/activity');
        return Array.isArray(res.data?.activities) ? res.data.activities : [];
      } catch (err) {
        return [];
      }
    },
    staleTime: 1000 * 30,
    enabled: Boolean(householdId),
  });

  // 3. Fetch Available Households for Switcher
  const {
    data: availableHouseholds = [],
    refetch: refetchAvailableHouseholds,
  } = useQuery<AvailableHouseholdItem[]>({
    queryKey: ['availableHouseholds', userId],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/family/households');
        return Array.isArray(res.data?.households) ? res.data.households : [];
      } catch (err) {
        return [];
      }
    },
    staleTime: 1000 * 60,
    enabled: Boolean(userId),
  });

  // 4. Fetch Cross-Module Snapshot (Tasks, Groceries, Bills)
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks', householdId],
    queryFn: async () => {
      const res = await apiClient.get('/tasks');
      return Array.isArray(res.data) ? res.data : res.data?.tasks || [];
    },
    staleTime: 1000 * 20,
    enabled: Boolean(householdId),
  });

  const { data: groceries = [] } = useQuery<GroceryItem[]>({
    queryKey: ['groceries', householdId],
    queryFn: async () => {
      const res = await apiClient.get('/inventory');
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    },
    staleTime: 1000 * 20,
    enabled: Boolean(householdId),
  });

  const { data: bills = [] } = useQuery<Bill[]>({
    queryKey: ['bills', householdId],
    queryFn: async () => {
      const res = await apiClient.get('/bills');
      return Array.isArray(res.data) ? res.data : res.data?.bills || [];
    },
    staleTime: 1000 * 20,
    enabled: Boolean(householdId),
  });

  // 5. Realtime Sync via Socket.IO
  useEffect(() => {
    if (!householdId) return;
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleMemberUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['householdMembers', householdId] });
      queryClient.invalidateQueries({ queryKey: ['householdActivity', householdId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary', householdId] });
    };

    const handleHouseholdUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['householdMembers', householdId] });
      queryClient.invalidateQueries({ queryKey: ['availableHouseholds', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary', householdId] });
    };

    socket.on('member_updated', handleMemberUpdate);
    socket.on('household_updated', handleHouseholdUpdate);

    return () => {
      socket.off('member_updated', handleMemberUpdate);
      socket.off('household_updated', handleHouseholdUpdate);
    };
  }, [householdId, userId, queryClient]);

  // Invalidate all household scoped caches
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['householdMembers', householdId] });
    queryClient.invalidateQueries({ queryKey: ['householdActivity', householdId] });
    queryClient.invalidateQueries({ queryKey: ['availableHouseholds', userId] });
    queryClient.invalidateQueries({ queryKey: ['dashboardSummary', householdId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', householdId] });
  };

  // 6. Mutations
  const renameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await apiClient.put('/family/name', { name: newName });
      return res.data?.household;
    },
    onSuccess: (updated) => {
      if (updated) {
        updateHousehold(updated);
      }
      invalidateAll();
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: string }) => {
      const res = await apiClient.put(`/family/members/${memberId}/role`, { role: newRole });
      return res.data?.user;
    },
    onSuccess: () => {
      invalidateAll();
    },
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: async (newOwnerId: string) => {
      const res = await apiClient.post('/family/transfer-ownership', { newOwnerId });
      return res.data;
    },
    onSuccess: () => {
      // Current user is now Admin
      updateUser({ role: 'ADMIN' });
      invalidateAll();
    },
  });

  const regenerateCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/family/regenerate-code');
      return res.data?.inviteCode;
    },
    onSuccess: (newCode) => {
      if (newCode) {
        updateHousehold({ inviteCode: newCode });
      }
      invalidateAll();
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await apiClient.delete(`/family/members/${memberId}`);
      return res.data;
    },
    onSuccess: () => {
      invalidateAll();
    },
  });

  const leaveHouseholdMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/family/leave');
      return res.data?.household;
    },
    onSuccess: (personalHousehold) => {
      if (personalHousehold) {
        updateHousehold(personalHousehold);
        updateUser({ householdId: personalHousehold.id, role: 'OWNER' });
      }
      invalidateAll();
    },
  });

  const deleteHouseholdMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/family/${id}`);
      return res.data?.household;
    },
    onSuccess: (newHousehold) => {
      if (newHousehold) {
        updateHousehold(newHousehold);
        updateUser({ householdId: newHousehold.id, role: 'OWNER' });
      }
      invalidateAll();
    },
  });

  const joinHouseholdMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const res = await apiClient.post('/family/join', { inviteCode });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.household) {
        updateHousehold(data.household);
      }
      if (data?.user) {
        updateUser(data.user);
      }
      queryClient.clear(); // Clear all tenant caches on household switch
      invalidateAll();
    },
  });

  const switchHouseholdMutation = useMutation({
    mutationFn: async (targetHouseholdId: string) => {
      const res = await apiClient.post('/family/switch', { householdId: targetHouseholdId });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.household) {
        updateHousehold(data.household);
      }
      if (data?.user) {
        updateUser(data.user);
      }
      queryClient.clear(); // Clear all tenant caches on household switch
      invalidateAll();
    },
  });

  return {
    household: currentHousehold,
    members,
    activity,
    availableHouseholds,
    tasks,
    groceries,
    bills,
    loadingMembers,
    loadingActivity,
    isMembersError,
    refetchMembers,
    refetchActivity,
    refetchAvailableHouseholds,
    renameMutation,
    roleMutation,
    transferOwnershipMutation,
    regenerateCodeMutation,
    removeMemberMutation,
    leaveHouseholdMutation,
    deleteHouseholdMutation,
    joinHouseholdMutation,
    switchHouseholdMutation,
  };
}
