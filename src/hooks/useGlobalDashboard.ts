import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { GlobalDashboardResponse } from '../api/types';
import { currentMonthKey } from '../utils/dashboardFinancial';
import { subscribeDashboardInvalidation } from '../utils/dashboardQueryCache';
import { fetchGlobalDashboardCached } from '../utils/globalDashboardQueryCache';

/**
 * Cross-space Action Center for My Spaces.
 * Loads on focus (TTL + inflight dedupe). Invalidation only refreshes while focused —
 * avoids stacked SpaceTabs screens triggering global sync storms in the background.
 */
export function useGlobalDashboard(enabled: boolean) {
  const [data, setData] = useState<GlobalDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const reloadInternal = useCallback(
    async (sync: boolean, force: boolean) => {
      if (!enabled) {
        setData(null);
        return;
      }
      setLoading(true);
      setError(false);
      try {
        const response = await fetchGlobalDashboardCached(currentMonthKey(), sync, {
          force,
        });
        setData(response);
      } catch {
        setError(true);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [enabled],
  );

  /** Pull-to-refresh / explicit refresh — always bypasses TTL. */
  const reload = useCallback(
    (sync = true) => reloadInternal(sync, true),
    [reloadInternal],
  );

  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return undefined;
      }
      void reloadInternal(true, false);
      const unsub = subscribeDashboardInvalidation(() => {
        void reloadInternal(true, true);
      });
      return unsub;
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
