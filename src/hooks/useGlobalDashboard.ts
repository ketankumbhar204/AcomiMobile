import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { GlobalDashboardResponse } from '../api/types';
import { currentMonthKey } from '../utils/dashboardFinancial';
import { subscribeDashboardInvalidation } from '../utils/dashboardQueryCache';
import { fetchGlobalDashboardCached } from '../utils/globalDashboardQueryCache';

/**
 * Cross-space Action Center for My Spaces.
 * Focus loads a fast unsynced snapshot first, then refreshes with sync in the
 * background (per-space pending-action sync can exceed the default API timeout).
 * Invalidation only refreshes while focused — avoids stacked SpaceTabs storms.
 */
export function useGlobalDashboard(enabled: boolean) {
  const [data, setData] = useState<GlobalDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const reloadInternal = useCallback(
    async (sync: boolean, force: boolean, options?: { quiet?: boolean }) => {
      if (!enabled) {
        setData(null);
        return;
      }
      const quiet = options?.quiet === true;
      if (!quiet) {
        setLoading(true);
        setError(false);
      }
      try {
        const response = await fetchGlobalDashboardCached(currentMonthKey(), sync, {
          force,
        });
        setData(response);
        setError(false);
      } catch {
        // Keep last good snapshot — clearing looks like "Everything is up to date".
        setError(true);
      } finally {
        if (!quiet) {
          setLoading(false);
        }
      }
    },
    [enabled],
  );

  /** Pull-to-refresh / explicit refresh — always bypasses TTL and syncs. */
  const reload = useCallback(
    (sync = true) => reloadInternal(sync, true),
    [reloadInternal],
  );

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return undefined;
      }

      let cancelled = false;

      void (async () => {
        // Fast path: existing notification rows (no per-space sync).
        await reloadInternal(false, false);
        if (cancelled) {
          return;
        }
        // Background sync so pending actions stay fresh without blocking first paint.
        await reloadInternal(true, true, { quiet: true });
      })();

      const unsub = subscribeDashboardInvalidation(() => {
        void reloadInternal(true, true);
      });

      return () => {
        cancelled = true;
        unsub();
      };
    }, [enabled, reloadInternal]),
  );

  return useMemo(
    () => ({
      data,
      loading,
      error,
      reload,
    }),
    [data, loading, error, reload],
  );
}
