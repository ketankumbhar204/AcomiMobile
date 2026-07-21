import type { DashboardSummaryResponse, SpaceType } from '../api/types';
import {
  fetchDashboardSummaryCached,
  invalidateDashboardQueries,
  peekDashboardSummary,
  resetDashboardQueryCacheForTests,
  subscribeDashboardCacheUpdate,
  subscribeDashboardInvalidation,
} from '../dashboardQueryCache';

jest.mock('../../api/dashboardApi', () => ({
  dashboardApi: {
    getDashboardSummary: jest.fn(),
  },
}));

import { dashboardApi } from '../../api/dashboardApi';

const spaceId = 'space-1';
const spaceType = 'PG' as SpaceType;
const month = '2026-07';

const summary = {
  spaceType,
  month,
  financial: {
    expectedCharges: 10000,
    collected: null,
    pending: 10000,
    currencyCode: 'INR',
  },
  attention: [
    {
      kind: 'payments_overdue' as const,
      overdueCount: 1,
      overdueAmount: 10000,
      currencyCode: 'INR',
    },
  ],
  accommodationOperations: {
    occupiedBeds: 1,
    vacantBeds: 213,
    moveInsThisMonth: 1,
    pendingPaymentsCount: 1,
  },
} as DashboardSummaryResponse;

describe('dashboardQueryCache', () => {
  beforeEach(() => {
    resetDashboardQueryCacheForTests();
    jest.clearAllMocks();
    (dashboardApi.getDashboardSummary as jest.Mock).mockResolvedValue(summary);
  });

  it('deduplicates concurrent dashboard-summary requests', async () => {
    const [first, second] = await Promise.all([
      fetchDashboardSummaryCached(spaceId, spaceType, month),
      fetchDashboardSummaryCached(spaceId, spaceType, month),
    ]);

    expect(first.attention).toHaveLength(1);
    expect(second.attention).toHaveLength(1);
    expect(dashboardApi.getDashboardSummary).toHaveBeenCalledTimes(1);
    expect(peekDashboardSummary(spaceId, month)?.accommodationOperations?.occupiedBeds).toBe(1);
  });

  it('serves cached summary without refetching', async () => {
    await fetchDashboardSummaryCached(spaceId, spaceType, month);
    await fetchDashboardSummaryCached(spaceId, spaceType, month);

    expect(dashboardApi.getDashboardSummary).toHaveBeenCalledTimes(1);
  });

  it('refetches when soft TTL expires', async () => {
    jest.useFakeTimers();
    await fetchDashboardSummaryCached(spaceId, spaceType, month);
    expect(dashboardApi.getDashboardSummary).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(30_001);
    await fetchDashboardSummaryCached(spaceId, spaceType, month);
    expect(dashboardApi.getDashboardSummary).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it('clears cached summary on invalidation so soft peeks stop serving stale Action Center data', async () => {
    await fetchDashboardSummaryCached(spaceId, spaceType, month);
    invalidateDashboardQueries();

    expect(peekDashboardSummary(spaceId, month)).toBeNull();

    await fetchDashboardSummaryCached(spaceId, spaceType, month);
    expect(dashboardApi.getDashboardSummary).toHaveBeenCalledTimes(2);
  });

  it('force refresh refetches after a warm cache', async () => {
    await fetchDashboardSummaryCached(spaceId, spaceType, month);
    await fetchDashboardSummaryCached(spaceId, spaceType, month, { force: true });
    expect(dashboardApi.getDashboardSummary).toHaveBeenCalledTimes(2);
  });

  it('notifies cache-update listeners on write, not invalidation listeners', async () => {
    const onCacheUpdate = jest.fn();
    const onInvalidation = jest.fn();
    const unsubCache = subscribeDashboardCacheUpdate(onCacheUpdate);
    const unsubInvalidation = subscribeDashboardInvalidation(onInvalidation);

    await fetchDashboardSummaryCached(spaceId, spaceType, month);
    expect(onCacheUpdate).toHaveBeenCalledTimes(1);
    expect(onInvalidation).not.toHaveBeenCalled();

    invalidateDashboardQueries();
    expect(onInvalidation).toHaveBeenCalledTimes(1);
    expect(onCacheUpdate).toHaveBeenCalledTimes(1);

    unsubCache();
    unsubInvalidation();
  });
});
