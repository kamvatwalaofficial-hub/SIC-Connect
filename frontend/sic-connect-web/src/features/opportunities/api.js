import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { queryKeys } from '../../lib/queryKeys.js';

export function useOpportunities() {
  return useQuery({
    queryKey: queryKeys.opportunities,
    queryFn: async () => (await apiClient.get('/opportunities')).data,
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: queryKeys.recommendations,
    queryFn: async () => (await apiClient.get('/opportunities/recommendations')).data,
  });
}

export function useCreateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await apiClient.post('/opportunities', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.opportunities }),
  });
}

export function useUpdateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => (await apiClient.put(`/opportunities/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.opportunities }),
  });
}

export function useDeleteOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => apiClient.delete(`/opportunities/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.opportunities }),
  });
}

export function useOpportunityApplications(opportunityId, enabled) {
  return useQuery({
    queryKey: ['opportunities', opportunityId, 'applications'],
    queryFn: async () => (await apiClient.get(`/opportunities/${opportunityId}/applications`)).data,
    enabled: Boolean(enabled && opportunityId),
  });
}

export function useUpdateApplicationStatus(opportunityId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ applicationId, status }) =>
      (await apiClient.put(`/applications/${applicationId}/status`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities', opportunityId, 'applications'] }),
  });
}
