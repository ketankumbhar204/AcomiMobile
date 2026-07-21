import type { GlobalDashboardResponse } from '../api/types';
import { dashboardApi } from '../api/dashboardApi';
import { currentMonthKey } from './dashboardFinancial';

type CacheEntry = {
  data: GlobalDashboardResponse;
  fetchedAt: number;
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<GlobalDashboardResponse>>();

/** Soft TTL — global sync is expensive (per-space pending-action sync). */
const TTL_MS = 30_000;

function cacheKey(month: string, sync: boolean): string {
  return `${month}:sync=${sync ? '1' : '0'}`;
}

export function clearGlobalDashboardCache(): void {
  cache.clear();
  inflight.clear();
}

export async function fetchGlobalDashboardCached(
  month = currentMonthKey(),
  sync = true,
  options?: { force?: boolean },
): Promise<GlobalDashboardResponse> {
  const key = cacheKey(month, sync);
  const now = Date.now();

  if (!options?.force) {
    const cached = cache.get(key);
    if (cached && now - cached.fetchedAt < TTL_MS) {
      return cached.data;
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
    .getGlobalDashboard(month, sync)
    .then(data => {
      cache.set(key, { data, fetchedAt: Date.now() });
      // A synced response is also a valid unsynced snapshot.
      if (sync) {
        cache.set(cacheKey(month, false), { data, fetchedAt: Date.now() });
      }
      return data;
    })
    .finally(() => {
      if (inflight.get(key) === request) {
        inflight.delete(key);
      }
    });

  inflight.set(key, request);
  return request;
}

/** Test-only helper. */
export function resetGlobalDashboardCacheForTests(): void {
  clearGlobalDashboardCache();
}
