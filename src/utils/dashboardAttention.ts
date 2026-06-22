import type { DashboardAttentionItem } from '../api/types';

export function mergeDashboardAttentionItems(
  base: DashboardAttentionItem[],
  subscriptionAttention: DashboardAttentionItem | null,
): DashboardAttentionItem[] {
  if (!subscriptionAttention) {
    return base;
  }
  if (base.some(item => item.kind === 'subscription_activation_pending')) {
    return base;
  }
  return [subscriptionAttention, ...base];
}
