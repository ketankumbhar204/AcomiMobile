import { useCallback, useEffect, useState } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { DashboardAccommodationOperations, UUID } from '../api/types';

type QuickAccommodationState = {
  loading: boolean;
  operations: DashboardAccommodationOperations | null;
  reload: () => Promise<void>;
};

/**
 * Fast bed counts for the dashboard (2 lightweight count queries).
 * Avoids N building-summary calls that compete with dashboard-summary.
 */
export function useDashboardAccommodationOperationsQuick(
  spaceId: UUID,
  enabled: boolean,
): QuickAccommodationState {
  const [loading, setLoading] = useState(false);
  const [operations, setOperations] = useState<DashboardAccommodationOperations | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setOperations(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [availablePage, occupiedPage] = await Promise.all([
        accommodationApi
          .searchBeds(spaceId, { status: 'AVAILABLE', page: 0, size: 1 })
          .catch(() => null),
        accommodationApi
          .searchBeds(spaceId, { status: 'OCCUPIED', page: 0, size: 1 })
          .catch(() => null),
      ]);

      if (!availablePage && !occupiedPage) {
        setOperations(null);
        return;
      }

      setOperations({
        occupiedBeds: occupiedPage?.totalElements ?? 0,
        vacantBeds: availablePage?.totalElements ?? 0,
        moveInsThisMonth: 0,
        pendingPaymentsCount: 0,
      });
    } catch {
      setOperations(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, spaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, operations, reload: load };
}
