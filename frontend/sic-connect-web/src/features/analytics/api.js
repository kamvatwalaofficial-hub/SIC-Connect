import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { queryKeys } from '../../lib/queryKeys.js';

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: queryKeys.analytics,
    queryFn: async () => (await apiClient.get('/analytics/summary')).data,
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => (await apiClient.get('/analytics/dashboard')).data,
  });
}
