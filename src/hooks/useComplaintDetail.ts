import { useCallback, useState } from 'react';
import { complaintsApi } from '../api/complaintsApi';
import type { ComplaintResponse, UUID } from '../api/types';
import { ApiError } from '../api/types';

export function useComplaintDetail(spaceId: UUID, complaintId: UUID) {
  const [complaint, setComplaint] = useState<ComplaintResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await complaintsApi.get(spaceId, complaintId);
      setComplaint(response);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load complaint';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [spaceId, complaintId]);

  return { complaint, setComplaint, loading, error, reload };
}
