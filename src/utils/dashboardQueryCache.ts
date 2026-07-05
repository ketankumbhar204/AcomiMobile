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
type InvalidationListener = () => void;
const listeners = new Set<InvalidationListener>();

export function getDashboardInvalidationGeneration(): number {
  return invalidationGeneration;
}

/** Marks dashboard data stale and notifies subscribers; keeps cached summaries for instant UI. */
export function invalidateDashboardQueries(): void {
  invalidationGeneration += 1;
  listeners.forEach(listener => listener());
}

export function subscribeDashboardInvalidation(listener: InvalidationListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
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
  listeners.clear();
}
