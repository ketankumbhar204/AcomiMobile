import {
  filterTenantVisibleNotifications,
  filterTenantVisiblePendingActions,
  isOwnerOnlyNotificationType,
} from '../ownerOnlyNotifications';
import type { PendingActionsSummary, SpaceNotification } from '../../api/types';

describe('ownerOnlyNotifications', () => {
  it('flags menu planning and payment-review types as owner-only', () => {
    expect(isOwnerOnlyNotificationType('MENU_NOT_PLANNED')).toBe(true);
    expect(isOwnerOnlyNotificationType('PAYMENT_NEEDS_REVIEW')).toBe(true);
    expect(isOwnerOnlyNotificationType('PAYMENT_NEEDS_UPDATE')).toBe(true);
    expect(isOwnerOnlyNotificationType('COMPLAINT_PENDING')).toBe(true);
    expect(isOwnerOnlyNotificationType('PAYMENT_UPDATE_REQUESTED')).toBe(false);
  });

  it('hides owner-only items from tenant notification lists', () => {
    const notifications = [
      { notificationType: 'MENU_NOT_PLANNED', status: 'UNREAD' },
      { notificationType: 'PAYMENT_NEEDS_REVIEW', status: 'UNREAD' },
      { notificationType: 'PAYMENT_UPDATE_REQUESTED', status: 'UNREAD' },
    ] as SpaceNotification[];

    const visible = filterTenantVisibleNotifications(notifications);
    expect(visible).toHaveLength(1);
    expect(visible[0].notificationType).toBe('PAYMENT_UPDATE_REQUESTED');
  });

  it('recomputes pending action totals after filtering', () => {
    const summary = {
      totalCount: 3,
      groups: [
        { actionType: 'MENU_NOT_PLANNED', title: 'Menu', count: 1, priority: 'HIGH', items: [] },
        {
          actionType: 'PAYMENT_NEEDS_REVIEW',
          title: 'Payment Reviews',
          count: 1,
          priority: 'HIGH',
          items: [],
        },
        {
          actionType: 'PAYMENT_UPDATE_REQUESTED',
          title: 'Payment',
          count: 1,
          priority: 'HIGH',
          items: [],
        },
      ],
    } as PendingActionsSummary;

    const filtered = filterTenantVisiblePendingActions(summary);
    expect(filtered?.totalCount).toBe(1);
    expect(filtered?.groups).toHaveLength(1);
    expect(filtered?.groups[0].actionType).toBe('PAYMENT_UPDATE_REQUESTED');
  });
});
