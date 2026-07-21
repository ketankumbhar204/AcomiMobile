import {
  filterTenantVisibleNotifications,
  filterTenantVisiblePendingActions,
  isOwnerOnlyNotificationType,
  isTenantVisiblePendingInvitation,
} from '../ownerOnlyNotifications';
import type { PendingActionsSummary, SpaceNotification } from '../../api/types';

describe('ownerOnlyNotifications', () => {
  it('flags menu, payment-review, and complaint types as owner-only', () => {
    expect(isOwnerOnlyNotificationType('MENU_NOT_PLANNED')).toBe(true);
    expect(isOwnerOnlyNotificationType('PAYMENT_NEEDS_REVIEW')).toBe(true);
    expect(isOwnerOnlyNotificationType('PAYMENT_NEEDS_UPDATE')).toBe(true);
    expect(isOwnerOnlyNotificationType('COMPLAINT_PENDING')).toBe(true);
    expect(isOwnerOnlyNotificationType('COMPLAINT_OVERDUE')).toBe(true);
    expect(isOwnerOnlyNotificationType('PAYMENT_UPDATE_REQUESTED')).toBe(false);
  });

  it('allows only invitee-shaped pending invitations for tenants', () => {
    expect(isTenantVisiblePendingInvitation('AcceptInvitations', 'Space invitation')).toBe(true);
    expect(isTenantVisiblePendingInvitation('Members', 'Pending invitation')).toBe(false);
    expect(isTenantVisiblePendingInvitation(null, 'Pending invitation')).toBe(false);
  });

  it('hides owner-only items from tenant notification lists', () => {
    const notifications = [
      { notificationType: 'MENU_NOT_PLANNED', status: 'UNREAD' },
      { notificationType: 'PAYMENT_NEEDS_REVIEW', status: 'UNREAD' },
      { notificationType: 'COMPLAINT_PENDING', status: 'UNREAD' },
      {
        notificationType: 'PENDING_INVITATION',
        status: 'UNREAD',
        actionRoute: 'Members',
        title: 'Pending invitation',
        message: '9555555555 · CUSTOMER',
      },
      {
        notificationType: 'PENDING_INVITATION',
        status: 'UNREAD',
        actionRoute: 'AcceptInvitations',
        title: 'Space invitation',
      },
      { notificationType: 'PAYMENT_UPDATE_REQUESTED', status: 'UNREAD' },
    ] as SpaceNotification[];

    const visible = filterTenantVisibleNotifications(notifications);
    expect(visible.map(n => n.notificationType)).toEqual([
      'PENDING_INVITATION',
      'PAYMENT_UPDATE_REQUESTED',
    ]);
    expect(visible[0].actionRoute).toBe('AcceptInvitations');
  });

  it('recomputes pending action totals after filtering owner + manager queues', () => {
    const summary = {
      totalCount: 4,
      groups: [
        { actionType: 'MENU_NOT_PLANNED', title: 'Menu', count: 1, priority: 'HIGH', items: [] },
        {
          actionType: 'COMPLAINT_PENDING',
          title: 'Complaints Pending',
          count: 1,
          priority: 'HIGH',
          items: [],
        },
        {
          actionType: 'PENDING_INVITATION',
          title: 'Pending Invitations',
          actionRoute: 'Members',
          count: 1,
          priority: 'MEDIUM',
          items: [
            {
              notificationType: 'PENDING_INVITATION',
              actionRoute: 'Members',
              title: 'Pending invitation',
              message: '9555555555 · CUSTOMER',
            },
          ],
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
