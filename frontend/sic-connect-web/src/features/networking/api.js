import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { queryKeys } from '../../lib/queryKeys.js';

export function useConnections() {
  return useQuery({
    queryKey: queryKeys.connections,
    queryFn: async () => (await apiClient.get('/networking/connections')).data,
  });
}

export function useSuggestions() {
  return useQuery({
    queryKey: queryKeys.suggestions,
    queryFn: async () => (await apiClient.get('/networking/suggestions')).data,
  });
}

function invalidateNetworking(qc) {
  qc.invalidateQueries({ queryKey: queryKeys.connections });
  qc.invalidateQueries({ queryKey: queryKeys.suggestions });
}

export function useRequestConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await apiClient.post('/networking/connections', payload)).data,
    onSuccess: () => invalidateNetworking(qc),
  });
}

export function useRespondConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accept }) =>
      (await apiClient.post(`/networking/connections/${id}/respond`, { accept })).data,
    onSuccess: () => invalidateNetworking(qc),
  });
}

export function useRemoveConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => apiClient.delete(`/networking/connections/${id}`),
    onSuccess: () => invalidateNetworking(qc),
  });
}
