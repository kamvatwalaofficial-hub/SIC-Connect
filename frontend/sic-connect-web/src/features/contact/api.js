import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';

/** Submit a public contact message. Delivered to administrators via their notifications. */
export function useSubmitContact() {
  return useMutation({
    mutationFn: async (payload) => (await apiClient.post('/contact', payload)).data,
  });
}
