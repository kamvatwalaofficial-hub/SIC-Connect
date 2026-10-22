import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { queryKeys } from '../../lib/queryKeys.js';

export function useDirectory(filters) {
  return useQuery({
    queryKey: queryKeys.directory(filters),
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null && v !== false),
      );
      return (await apiClient.get('/directory', { params })).data;
    },
    placeholderData: keepPreviousData,
  });
}
