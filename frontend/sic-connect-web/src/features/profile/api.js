import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { queryKeys } from '../../lib/queryKeys.js';

export function useMyProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => (await apiClient.get('/profiles/me')).data,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await apiClient.put('/profiles/me', payload)).data,
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.profile, data);
      qc.invalidateQueries({ queryKey: ['directory'] });
    },
  });
}

/** Upload a PDF CV (multipart). Returns { cvUrl }. */
export function useUploadCv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file) => {
      const data = new FormData();
      data.append('file', file);
      const res = await apiClient.post('/profiles/me/cv', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profile }),
  });
}

/** Remove the uploaded CV. Returns { cvUrl: null }. */
export function useDeleteCv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await apiClient.delete('/profiles/me/cv')).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.profile }),
  });
}
