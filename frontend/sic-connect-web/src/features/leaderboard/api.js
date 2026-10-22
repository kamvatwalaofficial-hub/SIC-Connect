import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { queryKeys } from '../../lib/queryKeys.js';

/**
 * Recognition leaderboard. `board` is 'alumni' or 'mentor'. Returns the top competitors
 * plus the caller's own rank (so the UI can show "You are ranked #N" when out of the top N).
 */
export function useLeaderboard(board = 'alumni', top = 10) {
  return useQuery({
    queryKey: queryKeys.leaderboard(board),
    queryFn: async () =>
      (await apiClient.get('/leaderboard', { params: { board, top } })).data,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
