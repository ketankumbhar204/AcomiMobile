import type { PendingActionsSummary, UUID } from '../api/types';
import { notificationsApi } from '../api/notificationsApi';
import { currentMonthKey } from './dashboardFinancial';

function cacheKey(spaceId: UUID, month: string): string {
  return `${spaceId}:${month}`;
}

type CacheEntry = {
  summary: PendingActionsSummary;
  fetchedAt: number;
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<PendingActionsSummary>>();

const TTL_MS = 15_000;

/**
 * Shared pending-actions fetch with in-flight dedupe.
 * Prevents Dashboard + NotificationBell from each triggering a full sync.
 */
export async function fetchPendingActionsCached(
  spaceId: UUID,
  month = currentMonthKey(),
  options?: { force?: boolean },
): Promise<PendingActionsSummary> {
  const key = cacheKey(spaceId, month);
  const now = Date.now();

  if (!options?.force) {
    const cached = cache.get(key);
    if (cached && now - cached.fetchedAt < TTL_MS) {
      return cached.summary;
    }
    const pending = inflight.get(key);
    if (pending) {
      return pending;
    }
  } else {
    const pending = inflight.get(key);
    if (pending) {
      return pending;
    }
  }

  const request = notificationsApi
    .getPendingActions(spaceId, month)
    .then(summary => {
      cache.set(key, { summary, fetchedAt: Date.now() });
      return summary;
    })
    .finally(() => {
      if (inflight.get(key) === request) {
        inflight.delete(key);
      }
    });

  inflight.set(key, request);
  return request;
}

export function peekPendingActions(
  spaceId: UUID,
  month = currentMonthKey(),
): PendingActionsSummary | null {
  return cache.get(cacheKey(spaceId, month))?.summary ?? null;
}

export function seedPendingActionsCache(
  spaceId: UUID,
  summary: PendingActionsSummary,
  month = currentMonthKey(),
): void {
  cache.set(cacheKey(spaceId, month), { summary, fetchedAt: Date.now() });
}

/** Test-only helper. */
export function resetPendingActionsCacheForTests(): void {
  cache.clear();
  inflight.clear();
}
