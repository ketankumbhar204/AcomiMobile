jest.mock('../../api/dashboardApi', () => ({ dashboardApi: {} }));
jest.mock('../../api/occupancyApi', () => ({ occupancyApi: { listOccupancies: jest.fn() } }));
jest.mock('../../api/paymentsApi', () => ({ paymentsApi: { listStayCharges: jest.fn() } }));

import { invalidateAfterOccupancyChange } from '../occupancyQueryCache';
import { ownerPaymentsMonthCache } from '../paymentsMonthCache';
import { stayPaymentRevision } from '../stayChargeIndex';

describe('occupancy stay refresh', () => {
  it('drops the cached bed occupant index after a move-in', () => {
    const before = stayPaymentRevision();
    invalidateAfterOccupancyChange();
    expect(stayPaymentRevision()).toBe(before + 1);
  });

  it('clears that space payment month list after an extend or vacate', () => {
    const spaceId = '11111111-1111-1111-1111-111111111111';
    const key = ownerPaymentsMonthCache.key(['summary', spaceId, '2026-11']);
    ownerPaymentsMonthCache.set(key, {
      month: '2026-11',
      spaceType: null,
      summary: {
        expectedCharges: null,
        collected: null,
        pending: null,
        currencyCode: 'INR',
      },
      members: [],
      payments: [],
      counts: {
        pendingReview: 0,
        submitted: 0,
        changesRequested: 0,
        paid: 0,
        rejected: 0,
        history: 0,
        pendingMembers: 0,
      },
    });
    const before = stayPaymentRevision();
    invalidateAfterOccupancyChange(spaceId);
    expect(ownerPaymentsMonthCache.get(key)).toBeNull();
    expect(stayPaymentRevision()).toBeGreaterThan(before);
  });
});
