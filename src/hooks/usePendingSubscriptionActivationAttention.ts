import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { subscriptionPlansApi } from '../api/subscriptionPlansApi';
import type { DashboardAttentionItem, UUID } from '../api/types';

export function usePendingSubscriptionActivationAttention(
  spaceId: UUID,
  enabled: boolean,
): DashboardAttentionItem | null {
  const [item, setItem] = useState<DashboardAttentionItem | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setItem(null);
      return;
    }

    try {
      const requests = await subscriptionPlansApi.listPendingRequests(spaceId);
      if (requests.length === 0) {
        setItem(null);
        return;
      }

      setItem({
        kind: 'subscription_activation_pending',
        pendingSubscriptionRequestCount: requests.length,
      });
    } catch {
      setItem(null);
    }
  }, [enabled, spaceId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return item;
}
