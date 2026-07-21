import { useEffect, useState } from 'react';
import type { UUID } from '../api/types';
import {
  peekPaymentsUnderReviewCount,
  subscribePaymentsReviewAttention,
} from '../utils/paymentsReviewAttentionCache';
import {
  subscribeDashboardCacheUpdate,
  subscribeDashboardInvalidation,
} from '../utils/dashboardQueryCache';

/**
 * Bottom-nav badge count for Payments (Owner/Manager).
 * Reads cached month summary / pending-actions — never fetches.
 */
export function usePaymentsUnderReviewBadge(spaceId: UUID, enabled: boolean): number {
  const [count, setCount] = useState(() =>
    enabled ? peekPaymentsUnderReviewCount(spaceId) : 0,
  );

  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return undefined;
    }
    const sync = () => setCount(peekPaymentsUnderReviewCount(spaceId));
    sync();
    const unsubAttention = subscribePaymentsReviewAttention(sync);
    const unsubCache = subscribeDashboardCacheUpdate(sync);
    const unsubInvalidation = subscribeDashboardInvalidation(sync);
    return () => {
      unsubAttention();
      unsubCache();
      unsubInvalidation();
    };
  }, [enabled, spaceId]);

  return enabled ? count : 0;
}
