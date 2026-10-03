import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../services/apiClient';
import { useAuthStore } from '../../../stores/useAuthStore';
import { AnalyticsPeriod, HouseholdAnalyticsData } from '../types';

interface UseAnalyticsOptions {
  period: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

export function useAnalytics({ period, startDate, endDate, enabled = true }: UseAnalyticsOptions) {
  const { household } = useAuthStore();
  const householdId = household?.id;

  return useQuery<HouseholdAnalyticsData>({
    queryKey: ['analytics', householdId, period, startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/household', {
        params: {
          period,
          startDate: period === 'custom' ? startDate : undefined,
          endDate: period === 'custom' ? endDate : undefined,
        },
      });
      return res.data;
    },
    enabled: !!householdId && enabled,
    staleTime: 30 * 1000,
    retry: 2,
  });
}
