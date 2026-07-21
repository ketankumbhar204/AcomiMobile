import type {
  NotificationType,
  PendingActionGroup,
  PendingActionsSummary,
  SpaceNotification,
} from '../api/types';

/**
 * Owner/manager Action Center types — never show to tenants/customers.
 * Tenants may still see PAYMENT_UPDATE_REQUESTED (their own “needs update” queue)
 * and invitee-shaped PENDING_INVITATION (AcceptInvitations).
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
  'MOVE_IN_SCHEDULED_TODAY',
  'MOVE_OUT_SCHEDULED_TODAY',
  'RESERVATION_STARTING_TODAY',
  'VACANT_RESERVED_BED',
  'EXPIRED_RESERVATION',
]);

/** Manager-facing invitation queue (Members). Invitees use AcceptInvitations. */
const MANAGER_INVITATION_ROUTES = new Set(['Members', 'Invitations', 'DashboardPendingActions']);

export function isOwnerOnlyNotificationType(type: NotificationType | string | undefined): boolean {
  if (!type) {
    return false;
  }
  return OWNER_ONLY_NOTIFICATION_TYPES.has(type as NotificationType);
}

/**
 * PENDING_INVITATION is dual-audience:
 * - Managers: actionRoute Members (message like "955… · CUSTOMER")
 * - Invitees: actionRoute AcceptInvitations
 * Tenants/customers must only see the invitee shape.
 */
export function isTenantVisiblePendingInvitation(
  actionRoute?: string | null,
  title?: string | null,
): boolean {
  const route = (actionRoute ?? '').trim();
  if (route === 'AcceptInvitations') {
    return true;
  }
  if (MANAGER_INVITATION_ROUTES.has(route)) {
    return false;
  }
  const normalizedTitle = (title ?? '').trim().toLowerCase();
  // Manager sync titles "Pending invitation"; invitee title is "Space invitation".
  if (normalizedTitle === 'pending invitation' || normalizedTitle === 'pending invitations') {
    return false;
  }
  // Unknown route: hide from tenants to avoid leaking manager Action Center rows.
  return false;
}

function isTenantVisibleNotification(notification: SpaceNotification): boolean {
  const type = notification.notificationType;
  if (type === 'PENDING_INVITATION') {
    return isTenantVisiblePendingInvitation(notification.actionRoute, notification.title);
  }
  return !isOwnerOnlyNotificationType(type);
}

function isTenantVisiblePendingGroup(group: PendingActionGroup): boolean {
  if (group.actionType === 'PENDING_INVITATION') {
    const routeVisible = isTenantVisiblePendingInvitation(group.actionRoute, group.title);
    if (!routeVisible) {
      return false;
    }
    // Also drop if every item is manager-shaped (defensive when group route is missing).
    if (group.items?.length) {
      return group.items.some(item =>
        isTenantVisiblePendingInvitation(item.actionRoute, item.title),
      );
    }
    return true;
  }
  return !isOwnerOnlyNotificationType(group.actionType);
}

export function filterTenantVisibleNotifications(
  notifications: SpaceNotification[],
): SpaceNotification[] {
  return notifications.filter(isTenantVisibleNotification);
}

export function filterTenantVisiblePendingActions(
  summary: PendingActionsSummary | null,
): PendingActionsSummary | null {
  if (!summary) {
    return null;
  }
  const groups = summary.groups
    .filter(isTenantVisiblePendingGroup)
    .map(group => {
      if (group.actionType !== 'PENDING_INVITATION' || !group.items?.length) {
        return group;
      }
      const items = group.items.filter(item =>
        isTenantVisiblePendingInvitation(item.actionRoute, item.title),
      );
      return { ...group, items, count: items.length };
    })
    .filter(group => group.count > 0);

  const totalCount = groups.reduce((sum: number, g: PendingActionGroup) => sum + g.count, 0);
  return { totalCount, groups };
}
