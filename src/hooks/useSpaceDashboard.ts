import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { dashboardApi } from '../api/dashboardApi';
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

export type SpaceDashboardState = {
  loading: boolean;
  financialLoading: boolean;
  summary: DashboardSummaryResponse | null;
  financial: DashboardFinancialSummary | null;
  attention: DashboardAttentionItem[];
  messOperations: DashboardMessOperations | null;
  accommodationOperations: DashboardAccommodationOperations | null;
  reload: () => Promise<void>;
};

export function useSpaceDashboard(
  spaceId: UUID,
  spaceType: SpaceType | undefined,
  enabled: boolean,
): SpaceDashboardState {
  const [loading, setLoading] = useState(true);
  const [financialLoading, setFinancialLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);

  const load = useCallback(async () => {
    if (!enabled || !spaceType) {
      setLoading(false);
      setFinancialLoading(false);
      setSummary(null);
      return;
    }

    setLoading(true);
    setFinancialLoading(true);

    try {
      const data = await dashboardApi.getDashboardSummary(
        spaceId,
        spaceType,
        currentMonthKey(),
      );
      setSummary(data);
    } finally {
      setLoading(false);
      setFinancialLoading(false);
    }
  }, [enabled, spaceId, spaceType]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return {
    loading,
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
