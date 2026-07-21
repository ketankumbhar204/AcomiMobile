import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { PendingActionsSummary, UUID } from '../api/types';
import { currentMonthKey } from '../utils/dashboardFinancial';
import {
  peekDashboardSummary,
  subscribeDashboardInvalidation,
} from '../utils/dashboardQueryCache';
import { filterTenantVisiblePendingActions } from '../utils/ownerOnlyNotifications';
import {
  fetchPendingActionsCached,
  peekPendingActions,
} from '../utils/pendingActionsQueryCache';

export function usePendingActions(spaceId: UUID, enabled: boolean, isOwnerOperator = false) {
  const month = currentMonthKey();
  const [summary, setSummary] = useState<PendingActionsSummary | null>(() => {
    if (!enabled) {
      return null;
    }
    const peeked =
      peekPendingActions(spaceId, month) ??
      peekDashboardSummary(spaceId, month)?.pendingActions ??
      null;
    return isOwnerOperator ? peeked : filterTenantVisiblePendingActions(peeked);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const applySummary = useCallback(
    (data: PendingActionsSummary) => {
      setSummary(isOwnerOperator ? data : filterTenantVisiblePendingActions(data));
    },
    [isOwnerOperator],
  );

  const reload = useCallback(
    async (force = false) => {
      if (!enabled) {
        setSummary(null);
        return;
      }
      // Tenants must not reuse a possibly owner-seeded cache entry as the sole source of truth.
      if (!force && isOwnerOperator) {
        const cached = peekPendingActions(spaceId, month);
        if (cached) {
          applySummary(cached);
          return;
        }
      }
      setLoading(true);
      setError(false);
      try {
        const data = await fetchPendingActionsCached(spaceId, month, {
          force: force || !isOwnerOperator,
        });
        applySummary(data);
      } catch {
        setError(true);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    },
    [applySummary, enabled, isOwnerOperator, month, spaceId],
  );

  useFocusEffect(
    useCallback(() => {
      // Respect TTL / inflight — force only after invalidateDashboardQueries.
      void reload(false);
    }, [reload]),
  );

  useEffect(() => {
    if (!enabled) {
      setSummary(null);
      return undefined;
    }
    return subscribeDashboardInvalidation(() => {
      void reload(true);
    });
  }, [enabled, reload]);

  useEffect(() => {
    if (!enabled) {
      setSummary(null);
    }
  }, [enabled]);

  return {
    summary,
    totalCount: summary?.totalCount ?? 0,
    groups: summary?.groups ?? [],
    loading,
    error,
    reload: () => reload(true),
  };
}
