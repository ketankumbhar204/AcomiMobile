import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type {
  DashboardAccommodationOperations,
  DashboardAttentionItem,
  DashboardFinancialSummary,
  DashboardMessOperations,
  DashboardSummaryResponse,
  SpaceType,
  UUID,
} from '../api/types';
import { currentMonthKey } from '../utils/dashboardFinancial';
import {
  fetchDashboardSummaryCached,
  getDashboardInvalidationGeneration,
  peekDashboardSummary,
  subscribeDashboardInvalidation,
} from '../utils/dashboardQueryCache';
import {
  getOccupancyInvalidationGeneration,
  subscribeOccupancyInvalidation,
} from '../utils/occupancyQueryCache';

export type SpaceDashboardState = {
  /** True only on the first load when no cached summary exists yet. */
  loading: boolean;
  /** True while a background refresh is in flight (stale data may still be shown). */
  refreshing: boolean;
  financialLoading: boolean;
  summary: DashboardSummaryResponse | null;
  financial: DashboardFinancialSummary | null;
  attention: DashboardAttentionItem[];
  messOperations: DashboardMessOperations | null;
  accommodationOperations: DashboardAccommodationOperations | null;
  reload: (force?: boolean) => Promise<void>;
};

export function useSpaceDashboard(
  spaceId: UUID,
  spaceType: SpaceType | undefined,
  enabled: boolean,
): SpaceDashboardState {
  const month = currentMonthKey();
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(() =>
    enabled && spaceType ? peekDashboardSummary(spaceId, month) : null,
  );
  const [loading, setLoading] = useState(() => {
    if (!enabled || !spaceType) {
      return false;
    }
    return peekDashboardSummary(spaceId, month) == null;
  });
  const [refreshing, setRefreshing] = useState(false);
  const [financialLoading, setFinancialLoading] = useState(loading);
  const [cacheGeneration, setCacheGeneration] = useState(
    getDashboardInvalidationGeneration() + getOccupancyInvalidationGeneration(),
  );
  const invalidationRef = useRef(cacheGeneration);

  useEffect(() => {
    const bumpDashboard = () => {
      setCacheGeneration(getDashboardInvalidationGeneration() + getOccupancyInvalidationGeneration());
    };
    const unsubDashboard = subscribeDashboardInvalidation(bumpDashboard);
    const unsubOccupancy = subscribeOccupancyInvalidation(bumpDashboard);
    return () => {
      unsubDashboard();
      unsubOccupancy();
    };
  }, []);

  useEffect(() => {
    if (!enabled || !spaceType) {
      return;
    }
    const cached = peekDashboardSummary(spaceId, month);
    setSummary(cached);
    setLoading(cached == null);
    setFinancialLoading(cached == null);
  }, [enabled, month, spaceId, spaceType]);

  const load = useCallback(
    async (force = false) => {
      if (!enabled) {
        setLoading(false);
        setRefreshing(false);
        setFinancialLoading(false);
        return;
      }

      if (!spaceType) {
        return;
      }

      const cached = peekDashboardSummary(spaceId, month);
      const hasCachedData = cached != null;

      if (force && hasCachedData) {
        setRefreshing(true);
        setFinancialLoading(false);
      } else if (!hasCachedData) {
        setLoading(true);
        setFinancialLoading(true);
      }

      try {
        const data = await fetchDashboardSummaryCached(spaceId, spaceType, month, { force });
        setSummary(data);
      } catch {
        if (!peekDashboardSummary(spaceId, month)) {
          setSummary(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setFinancialLoading(false);
      }
    },
    [enabled, month, spaceId, spaceType],
  );

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load]),
  );

  useEffect(() => {
    if (invalidationRef.current === cacheGeneration) {
      return;
    }
    invalidationRef.current = cacheGeneration;
    void load(true);
  }, [cacheGeneration, load]);

  useEffect(() => {
    if (enabled && spaceType && summary == null && !loading && !refreshing) {
      void load(false);
    }
  }, [enabled, load, loading, refreshing, spaceType, summary]);

  return {
    loading,
    refreshing,
    financialLoading,
    summary,
    financial: summary?.financial ?? null,
    attention: summary?.attention ?? [],
    messOperations: summary?.messOperations ?? null,
    accommodationOperations: summary?.accommodationOperations ?? null,
    reload: load,
  };
}

/** @deprecated Use useSpaceDashboard */
export function useMessOwnerDashboard(spaceId: UUID, enabled: boolean) {
  return useSpaceDashboard(spaceId, 'MESS', enabled);
}

export type { DashboardMessOperations };
