import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient.js';
import { queryKeys } from '../../lib/queryKeys.js';

/**
 * Whether the current alumnus can apply to become a mentor, and their progress toward it.
 * `enabled` lets callers skip the request for non-alumni (mentors/admins).
 */
export function useMentorEligibility(enabled = true) {
  return useQuery({
    queryKey: queryKeys.mentorEligibility,
    queryFn: async () => (await apiClient.get('/mentor/eligibility')).data,
    enabled,
    staleTime: 60_000,
  });
}

/** Submit a mentor application. Server re-validates eligibility and notifies administrators. */
export function useApplyForMentor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await apiClient.post('/mentor/apply')).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.mentorEligibility }),
  });
}
