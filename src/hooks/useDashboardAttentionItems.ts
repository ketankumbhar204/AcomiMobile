import { useMemo } from 'react';
import type { DashboardAttentionItem, UUID } from '../api/types';
import { mergeDashboardAttentionItems } from '../utils/dashboardAttention';
import { usePendingSubscriptionActivationAttention } from './usePendingSubscriptionActivationAttention';

export function useDashboardAttentionItems(
  spaceId: UUID,
  baseAttention: DashboardAttentionItem[],
  includeSubscription: boolean,
) {
  const subscriptionAttention = usePendingSubscriptionActivationAttention(
    spaceId,
    includeSubscription,
  );

  const items = useMemo(
    () => mergeDashboardAttentionItems(baseAttention, subscriptionAttention),
    [baseAttention, subscriptionAttention],
  );

  return items;
}
