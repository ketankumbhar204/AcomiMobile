import {
  fetchPendingActionsCached,
  peekPendingActions,
  resetPendingActionsCacheForTests,
  seedPendingActionsCache,
} from '../pendingActionsQueryCache';
import type { PendingActionsSummary } from '../../api/types';

jest.mock('../../api/notificationsApi', () => ({
  notificationsApi: {
    getPendingActions: jest.fn(async () => ({
      totalCount: 2,
      groups: [{ actionType: 'PAYMENT_NEEDS_REVIEW', count: 2, title: 'Reviews', items: [] }],
    })),
  },
}));

describe('pendingActionsQueryCache', () => {
  beforeEach(() => {
    resetPendingActionsCacheForTests();
    jest.clearAllMocks();
  });

  it('dedupes concurrent fetches', async () => {
    const { notificationsApi } = jest.requireMock('../../api/notificationsApi');
    const spaceId = 'space-1';
    const [a, b] = await Promise.all([
      fetchPendingActionsCached(spaceId, '2026-07'),
      fetchPendingActionsCached(spaceId, '2026-07'),
    ]);
    expect(notificationsApi.getPendingActions).toHaveBeenCalledTimes(1);
    expect(a.totalCount).toBe(2);
    expect(b.totalCount).toBe(2);
  });

  it('returns seeded cache without network', async () => {
    const { notificationsApi } = jest.requireMock('../../api/notificationsApi');
    const summary = { totalCount: 3, groups: [] } as PendingActionsSummary;
    seedPendingActionsCache('space-1', summary, '2026-07');
    expect(peekPendingActions('space-1', '2026-07')?.totalCount).toBe(3);
    const result = await fetchPendingActionsCached('space-1', '2026-07');
    expect(result.totalCount).toBe(3);
    expect(notificationsApi.getPendingActions).not.toHaveBeenCalled();
  });
});
