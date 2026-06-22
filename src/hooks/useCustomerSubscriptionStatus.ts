import { useCallback, useEffect, useState } from 'react';
import { subscriptionPlansApi } from '../api/subscriptionPlansApi';
import type { CustomerSubscriptionStatusResponse, UUID } from '../api/types';

export function useCustomerSubscriptionStatus(spaceId: UUID | null | undefined, memberId?: UUID | null) {
  const [status, setStatus] = useState<CustomerSubscriptionStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!spaceId) {
      setStatus(null);
      return null;
    }
    setLoading(true);
    try {
      const response =
        memberId != null
          ? await subscriptionPlansApi.getCustomerStatus(spaceId, memberId)
          : await subscriptionPlansApi.getMyCustomerStatus(spaceId);
      setStatus(response);
      return response;
    } catch (error) {
      if (__DEV__) {
        console.warn('[useCustomerSubscriptionStatus] failed to load status', error);
      }
      setStatus(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [memberId, spaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { status, loading, reload };
}
