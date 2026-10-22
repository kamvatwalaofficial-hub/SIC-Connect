import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { queryKeys } from '../../lib/queryKeys.js';

export function useEvents() {
  return useQuery({
    queryKey: queryKeys.events,
    queryFn: async () => (await apiClient.get('/events')).data,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await apiClient.post('/events', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.events }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => (await apiClient.put(`/events/${id}`, payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.events }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => apiClient.delete(`/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.events }),
  });
}

export function useEventAttendees(eventId, enabled) {
  return useQuery({
    queryKey: ['events', eventId, 'attendees'],
    queryFn: async () => (await apiClient.get(`/events/${eventId}/attendees`)).data,
    enabled: Boolean(enabled && eventId),
  });
}

export function useToggleRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isRegistered }) =>
      isRegistered
        ? apiClient.delete(`/events/${id}/register`)
        : apiClient.post(`/events/${id}/register`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.events }),
  });
}
