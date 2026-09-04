import { useCallback, useEffect, useMemo, useState } from 'react';
import { occupancyApi } from '../api/occupancyApi';
import type { OccupancyResponse, OccupancyStatus, UUID } from '../api/types';
import { currentMonthKey } from '../utils/dashboardFinancial';
import { getOccupancyErrorMessage } from '../utils/occupancyErrors';

export type DashboardOccupancyListMode = 'active' | 'moveInsThisMonth';

type UseSpaceOccupancyListOptions = {
  spaceId: UUID;
  mode: DashboardOccupancyListMode;
  query?: string;
  enabled?: boolean;
};

function occupancyMatchesQuery(occupancy: OccupancyResponse, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  const haystack = [
    occupancy.memberName,
    occupancy.buildingName,
    occupancy.floorName,
    occupancy.unitName,
    occupancy.roomName,
    occupancy.bedName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

function occupancyMatchesMode(occupancy: OccupancyResponse, mode: DashboardOccupancyListMode): boolean {
  if (mode === 'active') {
    return occupancy.status === 'ACTIVE';
  }
  const month = currentMonthKey();
  const moveIn = occupancy.moveInDate ?? occupancy.actualMoveInAt?.slice(0, 10);
  return occupancy.status === 'ACTIVE' && moveIn?.startsWith(`${month}-`) === true;
}

export function useSpaceOccupancyList({
  spaceId,
  mode,
  query = '',
  enabled = true,
}: UseSpaceOccupancyListOptions) {
  const [rows, setRows] = useState<OccupancyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!enabled) {
        setLoading(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      }

      try {
        const status: OccupancyStatus = mode === 'active' || mode === 'moveInsThisMonth' ? 'ACTIVE' : 'ACTIVE';
        const response = await occupancyApi.listOccupancies(spaceId, {
          status,
          size: 500,
        });
        setRows(response.content ?? []);
        setError(null);
      } catch (err) {
        setError(getOccupancyErrorMessage(err, 'occupancy.errors.loadList'));
        setRows([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [enabled, mode, spaceId],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const items = useMemo(
    () =>
      rows.filter(
        row => occupancyMatchesMode(row, mode) && occupancyMatchesQuery(row, query),
      ),
    [mode, query, rows],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
  }, [load]);

  return {
    items,
    loading,
    refreshing,
    error,
    refresh,
  };
}
