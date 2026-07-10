import { normalizePendingActionsSummary } from '../normalizeDashboardSummary';

describe('normalizePendingActionsSummary', () => {
  it('normalizes grouped pending actions from the notification service', () => {
    const summary = normalizePendingActionsSummary({
      totalCount: 4,
      groups: [
        {
          actionType: 'PAYMENT_NEEDS_REVIEW',
          title: 'Payment Reviews',
          actionLabel: 'Review Payment',
          actionRoute: 'Payments/pendingReview',
          priority: 'HIGH',
          count: 2,
          items: [
            {
              notificationId: 'n1',
              spaceId: 's1',
              userId: 'u1',
              entityType: 'PAYMENT',
              entityId: 'p1',
              notificationType: 'PAYMENT_NEEDS_REVIEW',
              category: 'ACTION_REQUIRED',
              priority: 'HIGH',
              title: 'Payment needs review',
              status: 'UNREAD',
              deliveryChannels: ['IN_APP'],
              createdAt: '2026-07-10T00:00:00',
              updatedAt: '2026-07-10T00:00:00',
            },
          ],
        },
        {
          actionType: 'PAYMENT_NEEDS_UPDATE',
          title: 'Needs Update',
          priority: 'MEDIUM',
          count: 2,
          items: [],
        },
      ],
    });

    expect(summary.totalCount).toBe(4);
    expect(summary.groups).toHaveLength(2);
    expect(summary.groups[0].actionType).toBe('PAYMENT_NEEDS_REVIEW');
    expect(summary.groups[0].items[0].deliveryChannels).toEqual(['IN_APP']);
    expect(summary.groups[1].count).toBe(2);
  });
});
