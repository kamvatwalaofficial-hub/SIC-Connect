import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { queryKeys } from '../../lib/queryKeys.js';

export function useAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements,
    queryFn: async () => (await apiClient.get('/announcements')).data,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await apiClient.post('/announcements', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.announcements }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => apiClient.delete(`/announcements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.announcements }),
  });
}
