import type { NotificationType, PendingActionGroup, PendingActionsSummary, SpaceNotification } from '../api/types';

/**
 * Owner/manager Action Center types — never show to tenants/customers.
 * Tenants may still see PAYMENT_UPDATE_REQUESTED (their own “needs update” queue).
 */
export const OWNER_ONLY_NOTIFICATION_TYPES: ReadonlySet<NotificationType> = new Set([
  'MENU_NOT_PLANNED',
  'MENU_DRAFT_PENDING_PUBLISH',
  'MEAL_POLL_NOT_PUBLISHED',
  'MEAL_RESPONSES_BELOW_THRESHOLD',
  'SUBSCRIPTION_ACTIVATION_PENDING',
  'PAYMENT_NEEDS_REVIEW',
  'PAYMENT_NEEDS_UPDATE',
  'PAYMENT_OVERDUE',
  'COMPLAINT_PENDING',
  'COMPLAINT_OVERDUE',
]);

export function isOwnerOnlyNotificationType(type: NotificationType | string | undefined): boolean {
  if (!type) {
    return false;
  }
  return OWNER_ONLY_NOTIFICATION_TYPES.has(type as NotificationType);
}

export function filterTenantVisibleNotifications(
  notifications: SpaceNotification[],
): SpaceNotification[] {
  return notifications.filter(n => !isOwnerOnlyNotificationType(n.notificationType));
}

export function filterTenantVisiblePendingActions(
  summary: PendingActionsSummary | null,
): PendingActionsSummary | null {
  if (!summary) {
    return null;
  }
  const groups = summary.groups.filter(g => !isOwnerOnlyNotificationType(g.actionType));
  const totalCount = groups.reduce((sum: number, g: PendingActionGroup) => sum + g.count, 0);
  return { totalCount, groups };
}
