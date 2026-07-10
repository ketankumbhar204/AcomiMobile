import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { PendingActionsSummary, UUID } from '../api/types';
import { currentMonthKey } from '../utils/dashboardFinancial';
import { peekDashboardSummary } from '../utils/dashboardQueryCache';
import { filterTenantVisiblePendingActions } from '../utils/ownerOnlyNotifications';
import {
  fetchPendingActionsCached,
  peekPendingActions,
  seedPendingActionsCache,
} from '../utils/pendingActionsQueryCache';

export function usePendingActions(spaceId: UUID, enabled: boolean, isOwnerOperator = false) {
  const month = currentMonthKey();
  const [summary, setSummary] = useState<PendingActionsSummary | null>(() => {
    if (!enabled) {
      return null;
    }
    return (
      peekPendingActions(spaceId, month) ??
      peekDashboardSummary(spaceId, month)?.pendingActions ??
      null
    );
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
      if (!force) {
        const fromDash = peekDashboardSummary(spaceId, month)?.pendingActions;
        if (fromDash) {
          seedPendingActionsCache(spaceId, fromDash, month);
          applySummary(fromDash);
          return;
        }
        const cached = peekPendingActions(spaceId, month);
        if (cached) {
          applySummary(cached);
          return;
        }
      }
      setLoading(true);
      setError(false);
      try {
        const data = await fetchPendingActionsCached(spaceId, month, { force });
        applySummary(data);
      } catch {
        setError(true);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    },
    [applySummary, enabled, month, spaceId],
  );

  useFocusEffect(
    useCallback(() => {
      void reload(false);
    }, [reload]),
  );

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
