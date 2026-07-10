import { useCallback, useState } from 'react';
import { complaintsApi } from '../api/complaintsApi';
import type { ComplaintListResponse, ListComplaintsParams, UUID } from '../api/types';
import { ApiError } from '../api/types';

export function useComplaintsList(spaceId: UUID, params?: ListComplaintsParams) {
  const [data, setData] = useState<ComplaintListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await complaintsApi.list(spaceId, params);
      setData(response);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load complaints';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [spaceId, params?.status, params?.priority, params?.category, params?.mine, params?.assigneeMembershipId]);

  return { data, loading, error, reload };
}
