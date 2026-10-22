import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { queryKeys } from '../../lib/queryKeys.js';

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: async () => (await apiClient.get('/admin/users')).data,
  });
}

export function useAdminMentorships() {
  return useQuery({
    queryKey: ['admin', 'mentorships'],
    queryFn: async () => (await apiClient.get('/admin/mentorships')).data,
  });
}

export function useApprovals() {
  return useQuery({
    queryKey: ['admin', 'approvals'],
    queryFn: async () => (await apiClient.get('/admin/approvals')).data,
  });
}

function useApprovalAction(makeRequest) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: makeRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'approvals'] });
      qc.invalidateQueries({ queryKey: queryKeys.adminUsers });
      qc.invalidateQueries({ queryKey: ['analytics', 'dashboard'] });
    },
  });
}

export function useApproveAccount() {
  return useApprovalAction(({ id }) => apiClient.post(`/admin/approvals/${id}/approve`));
}

export function useRejectAccount() {
  return useApprovalAction(({ id, note }) => apiClient.post(`/admin/approvals/${id}/reject`, { note }));
}

export function useRequestAccountInfo() {
  return useApprovalAction(({ id, note }) => apiClient.post(`/admin/approvals/${id}/request-info`, { note }));
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }) => (await apiClient.put(`/admin/users/${id}/role`, { role })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminUsers }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => apiClient.delete(`/admin/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.adminUsers }),
  });
}
