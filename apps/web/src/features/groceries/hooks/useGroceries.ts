import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../services/apiClient';
import { socketService } from '../../../services/socketService';
import { GroceryItem } from '../../../types';
import { useAuthStore } from '../../../stores/useAuthStore';

export function useGroceries() {
  const queryClient = useQueryClient();
  const { household } = useAuthStore();
  const householdId = household?.id || 'default';

  // React Query Fetch Groceries (Strictly household scoped)
  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<GroceryItem[]>({
    queryKey: ['groceries', householdId],
    queryFn: async () => {
      const res = await apiClient.get('/inventory');
      const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
      return list;
    },
    staleTime: 1000 * 20, // 20 seconds fresh
    enabled: Boolean(householdId),
  });

  // Real-time synchronization via Socket.IO
  useEffect(() => {
    if (!householdId) return;
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['groceries', householdId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', householdId] });
    };

    socket.on('grocery_updated', handleUpdate);

    return () => {
      socket.off('grocery_updated', handleUpdate);
    };
  }, [householdId, queryClient]);

  // Mutation: Add Item (Optimistic)
  const addMutation = useMutation({
    mutationFn: async (newItem: Partial<GroceryItem>) => {
      const res = await apiClient.post('/inventory', newItem);
      return res.data?.item;
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ['groceries', householdId] });
      const previousItems = queryClient.getQueryData<GroceryItem[]>(['groceries', householdId]) || [];

      const optimisticItem: GroceryItem = {
        id: 'temp-' + Date.now(),
        householdId,
        name: newItem.name || 'New Item',
        category: newItem.category || 'Other',
        quantity: newItem.quantity || 1,
        unit: newItem.unit || 'pcs',
        minThreshold: newItem.minThreshold || 1,
        expiryDate: newItem.expiryDate || null,
        purchaseDate: newItem.purchaseDate || null,
        barcode: newItem.barcode || null,
        createdBy: 'You',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<GroceryItem[]>(['groceries', householdId], [optimisticItem, ...previousItems]);
      return { previousItems };
    },
    onError: (_err, _newItem, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['groceries', householdId], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['groceries', householdId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', householdId] });
    },
  });

  // Mutation: Edit Item (Optimistic)
  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GroceryItem> }) => {
      const res = await apiClient.put(`/inventory/${id}`, data);
      return res.data?.item;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['groceries', householdId] });
      const previousItems = queryClient.getQueryData<GroceryItem[]>(['groceries', householdId]) || [];

      queryClient.setQueryData<GroceryItem[]>(
        ['groceries', householdId],
        previousItems.map((item) => (item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item))
      );

      return { previousItems };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['groceries', householdId], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['groceries', householdId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', householdId] });
    },
  });

  // Mutation: Toggle Purchase (Optimistic with instant checkmark feedback)
  const togglePurchaseMutation = useMutation({
    mutationFn: async ({ id, purchased }: { id: string; purchased: boolean }) => {
      const res = await apiClient.put(`/inventory/${id}/purchase`, {
        purchased,
        purchaseDate: purchased ? new Date().toISOString() : null,
      });
      return res.data?.item;
    },
    onMutate: async ({ id, purchased }) => {
      await queryClient.cancelQueries({ queryKey: ['groceries', householdId] });
      const previousItems = queryClient.getQueryData<GroceryItem[]>(['groceries', householdId]) || [];

      queryClient.setQueryData<GroceryItem[]>(
        ['groceries', householdId],
        previousItems.map((item) =>
          item.id === id
            ? {
                ...item,
                purchaseDate: purchased ? new Date().toISOString() : null,
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      return { previousItems };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['groceries', householdId], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['groceries', householdId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', householdId] });
    },
  });

  // Mutation: Adjust Quantity (Optimistic)
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const res = await apiClient.put(`/inventory/${id}/quantity`, { quantity });
      return res.data?.item;
    },
    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['groceries', householdId] });
      const previousItems = queryClient.getQueryData<GroceryItem[]>(['groceries', householdId]) || [];

      queryClient.setQueryData<GroceryItem[]>(
        ['groceries', householdId],
        previousItems.map((item) => (item.id === id ? { ...item, quantity } : item))
      );

      return { previousItems };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['groceries', householdId], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['groceries', householdId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', householdId] });
    },
  });

  // Mutation: Delete Item (Optimistic)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/inventory/${id}`);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['groceries', householdId] });
      const previousItems = queryClient.getQueryData<GroceryItem[]>(['groceries', householdId]) || [];

      queryClient.setQueryData<GroceryItem[]>(
        ['groceries', householdId],
        previousItems.filter((item) => item.id !== id)
      );

      return { previousItems };
    },
    onError: (_err, _id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['groceries', householdId], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['groceries', householdId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', householdId] });
    },
  });

  return {
    items,
    isLoading,
    isError,
    error,
    refetch,
    householdId,
    addItem: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    editItem: editMutation.mutateAsync,
    isEditing: editMutation.isPending,
    togglePurchase: togglePurchaseMutation.mutateAsync,
    isTogglingPurchase: togglePurchaseMutation.isPending,
    updateQuantity: updateQuantityMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
