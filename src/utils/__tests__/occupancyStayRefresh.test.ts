jest.mock('../../api/dashboardApi', () => ({ dashboardApi: {} }));
jest.mock('../../api/occupancyApi', () => ({ occupancyApi: { listOccupancies: jest.fn() } }));
jest.mock('../../api/paymentsApi', () => ({ paymentsApi: { listStayCharges: jest.fn() } }));

import { invalidateAfterOccupancyChange } from '../occupancyQueryCache';
import { stayPaymentRevision } from '../stayChargeIndex';

describe('occupancy stay refresh', () => {
  it('drops the cached bed occupant index after a move-in', () => {
    const before = stayPaymentRevision();
    invalidateAfterOccupancyChange();
    expect(stayPaymentRevision()).toBe(before + 1);
  });
});
