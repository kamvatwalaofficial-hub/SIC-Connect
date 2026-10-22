import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { queryKeys } from '../../lib/queryKeys.js';

export function useMyApplications() {
  return useQuery({
    queryKey: queryKeys.myApplications,
    queryFn: async () => (await apiClient.get('/applications/me')).data,
  });
}

export function useApplyToOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ opportunityId, coverNote }) =>
      (await apiClient.post(`/opportunities/${opportunityId}/apply`, { coverNote })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myApplications });
      qc.invalidateQueries({ queryKey: queryKeys.recommendations });
    },
  });
}

export function useWithdrawApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => apiClient.delete(`/applications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myApplications });
      qc.invalidateQueries({ queryKey: queryKeys.recommendations });
    },
  });
}
