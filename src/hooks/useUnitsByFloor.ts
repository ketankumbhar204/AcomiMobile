import { useCallback, useMemo } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { UUID } from '../api/types';
import { accommodationQueryKeys } from '../utils/accommodationQueryCache';
import { useAccommodationPagedList } from './useAccommodationPagedList';

export function useUnitsByFloor(
  spaceId: UUID | null,
  buildingId: UUID | null,
  floorId: UUID | null,
  options?: { enabled?: boolean; searchQuery?: string },
) {
  const enabled = options?.enabled ?? Boolean(spaceId && buildingId && floorId);
  const searchQuery = options?.searchQuery ?? '';

  const fetchPage = useCallback(
    (params: Parameters<typeof accommodationApi.listUnitsByFloor>[3]) => {
      if (!spaceId || !buildingId || !floorId) {
        return Promise.reject(new Error('Missing spaceId, buildingId, or floorId'));
      }
      return accommodationApi.listUnitsByFloor(spaceId, buildingId, floorId, params);
    },
    [buildingId, floorId, spaceId],
  );

  const queryKey = useMemo(
    () =>
      spaceId && buildingId && floorId
        ? accommodationQueryKeys.unitsByFloor(spaceId, buildingId, floorId, {
            query: searchQuery,
          })
        : (['unitsByFloor'] as const),
    [buildingId, floorId, searchQuery, spaceId],
  );

  const result = useAccommodationPagedList(fetchPage, {
    enabled,
    searchQuery,
    errorKey: 'accommodation.errors.loadUnits',
    logTag: 'useUnitsByFloor',
    queryKey,
    sort: 'unitNumber',
  });

  return {
    units: result.items,
    loading: result.loading,
    loadingMore: result.loadingMore,
    error: result.error,
    hasMore: result.hasMore,
    totalElements: result.totalElements,
    refresh: result.refresh,
    loadMore: result.loadMore,
  };
}
