import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';

const keys = {
  conversations: ['messages', 'conversations'],
  unread: ['messages', 'unread-count'],
  thread: (id) => ['messages', 'thread', id],
};

export function useConversations() {
  return useQuery({
    queryKey: keys.conversations,
    queryFn: async () => (await apiClient.get('/messages/conversations')).data,
    refetchInterval: 15_000, // near real-time without websockets
  });
}

export function useUnreadMessages() {
  return useQuery({
    queryKey: keys.unread,
    queryFn: async () => (await apiClient.get('/messages/unread-count')).data,
    refetchInterval: 30_000,
  });
}

export function useThread(otherUserId) {
  return useQuery({
    queryKey: keys.thread(otherUserId),
    queryFn: async () => (await apiClient.get(`/messages/${otherUserId}`)).data,
    enabled: Boolean(otherUserId),
    refetchInterval: otherUserId ? 8_000 : false,
  });
}

export function useSendMessage(otherUserId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await apiClient.post(`/messages/${otherUserId}`, { body })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.thread(otherUserId) });
      qc.invalidateQueries({ queryKey: keys.conversations });
    },
  });
}
