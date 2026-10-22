import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { queryKeys } from '../../lib/queryKeys.js';

export function useMyProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: async () => (await apiClient.get('/projects')).data,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await apiClient.post('/projects', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects });
      qc.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => apiClient.delete(`/projects/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects });
      qc.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}
