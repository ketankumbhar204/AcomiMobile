import type { DashboardSummaryResponse, SpaceType, UUID } from '../api/types';
import { dashboardApi } from '../api/dashboardApi';
import { currentMonthKey } from './dashboardFinancial';
import { normalizeDashboardSummary } from './normalizeDashboardSummary';

export function dashboardCacheKey(spaceId: UUID, month: string): string {
  return `${spaceId}:${month}`;
}

type CacheEntry = {
  summary: DashboardSummaryResponse;
  fetchedAt: number;
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<DashboardSummaryResponse>>();

let invalidationGeneration = 0;
type Listener = () => void;
/** Fired only by invalidateDashboardQueries — subscribers should force-refresh. */
const invalidationListeners = new Set<Listener>();
/** Fired when cache is written — subscribers may re-read peek() without refetching. */
const cacheUpdateListeners = new Set<Listener>();

export function getDashboardInvalidationGeneration(): number {
  return invalidationGeneration;
}

/** Marks dashboard data stale and notifies invalidation subscribers; keeps cached summaries. */
export function invalidateDashboardQueries(): void {
  invalidationGeneration += 1;
  invalidationListeners.forEach(listener => listener());
}

export function subscribeDashboardInvalidation(listener: Listener): () => void {
  invalidationListeners.add(listener);
  return () => invalidationListeners.delete(listener);
}

/** Observe successful cache writes (e.g. bell badge) without triggering force reloads. */
export function subscribeDashboardCacheUpdate(listener: Listener): () => void {
  cacheUpdateListeners.add(listener);
  return () => cacheUpdateListeners.delete(listener);
}

export function peekDashboardSummary(
  spaceId: UUID,
  month = currentMonthKey(),
): DashboardSummaryResponse | null {
  return cache.get(dashboardCacheKey(spaceId, month))?.summary ?? null;
}

export async function fetchDashboardSummaryCached(
  spaceId: UUID,
  spaceType: SpaceType,
  month = currentMonthKey(),
  options?: { force?: boolean },
): Promise<DashboardSummaryResponse> {
  const key = dashboardCacheKey(spaceId, month);

  if (!options?.force) {
    const cached = cache.get(key);
    if (cached) {
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

  const request = dashboardApi
    .getDashboardSummary(spaceId, spaceType, month)
    .then(data => {
      const normalized = normalizeDashboardSummary(data);
      cache.set(key, { summary: normalized, fetchedAt: Date.now() });
      // Notify observers only — never invalidation listeners (that caused force-refetch loops).
      cacheUpdateListeners.forEach(listener => listener());
      return normalized;
    })
    .finally(() => {
      if (inflight.get(key) === request) {
        inflight.delete(key);
      }
    });

  inflight.set(key, request);
  return request;
}

/** Test-only helper to reset module state. */
export function resetDashboardQueryCacheForTests(): void {
  invalidationGeneration = 0;
  cache.clear();
  inflight.clear();
  invalidationListeners.clear();
  cacheUpdateListeners.clear();
}
