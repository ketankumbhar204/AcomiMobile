import {
  clearGlobalDashboardCache,
  fetchGlobalDashboardCached,
  resetGlobalDashboardCacheForTests,
} from '../globalDashboardQueryCache';

jest.mock('../../api/dashboardApi', () => ({
  dashboardApi: {
    getGlobalDashboard: jest.fn(async () => ({
      totalAttentionCount: 1,
      unreadNotificationCount: 0,
      attentionRequired: [],
      attentionHasMore: false,
      recentActivity: [],
      activityHasMore: false,
      spaceSummaries: [],
    })),
  },
}));

import { dashboardApi } from '../../api/dashboardApi';

describe('globalDashboardQueryCache', () => {
  beforeEach(() => {
    resetGlobalDashboardCacheForTests();
    jest.clearAllMocks();
  });

  it('dedupes concurrent global dashboard fetches', async () => {
    const [a, b] = await Promise.all([
      fetchGlobalDashboardCached('2026-07', true),
      fetchGlobalDashboardCached('2026-07', true),
    ]);
    expect(dashboardApi.getGlobalDashboard).toHaveBeenCalledTimes(1);
    expect(a.totalAttentionCount).toBe(1);
    expect(b.totalAttentionCount).toBe(1);
  });

  it('serves TTL cache without refetch', async () => {
    await fetchGlobalDashboardCached('2026-07', true);
    await fetchGlobalDashboardCached('2026-07', true);
    expect(dashboardApi.getGlobalDashboard).toHaveBeenCalledTimes(1);
  });

  it('clears on clearGlobalDashboardCache', async () => {
    await fetchGlobalDashboardCached('2026-07', true);
    clearGlobalDashboardCache();
    await fetchGlobalDashboardCached('2026-07', true);
    expect(dashboardApi.getGlobalDashboard).toHaveBeenCalledTimes(2);
  });
});
