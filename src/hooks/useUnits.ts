import { useCallback, useMemo } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { UnitListItemResponse, UUID } from '../api/types';
import { accommodationQueryKeys } from '../utils/accommodationQueryCache';
import { accommodationInactiveScopeKey } from '../utils/accommodationInactiveRegistry';
import { useAccommodationPagedList } from './useAccommodationPagedList';

export function useUnits(
  spaceId: UUID | null,
  buildingId: UUID | null,
  options?: { enabled?: boolean; searchQuery?: string },
) {
  const enabled = options?.enabled ?? Boolean(spaceId && buildingId);
  const searchQuery = options?.searchQuery ?? '';

  const inactiveScopeKey = useMemo(
    () =>
      spaceId && buildingId
        ? accommodationInactiveScopeKey('unit', { spaceId, buildingId })
        : null,
    [buildingId, spaceId],
  );

  const fetchPage = useCallback(
    (params: Parameters<typeof accommodationApi.listUnits>[2]) => {
      if (!spaceId || !buildingId) {
        return Promise.reject(new Error('Missing spaceId or buildingId'));
      }
      return accommodationApi.listUnits(spaceId, buildingId, params);
    },
    [buildingId, spaceId],
  );

  const queryKey = useMemo(
    () =>
      spaceId && buildingId
        ? accommodationQueryKeys.units(spaceId, buildingId, { query: searchQuery })
        : (['units'] as const),
    [buildingId, searchQuery, spaceId],
  );

  const result = useAccommodationPagedList(fetchPage, {
    enabled,
    searchQuery,
    errorKey: 'accommodation.errors.loadUnits',
    logTag: 'useUnits',
    queryKey,
    sort: 'unitNumber',
    inactiveScopeKey,
    getItemId: item => item.unitId,
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
    patchUnit: (unitId: UUID, patch: Partial<UnitListItemResponse>) =>
      result.patchItems(item => item.unitId === unitId, patch),
    removeUnit: (unitId: UUID) => result.removeItems(item => item.unitId === unitId),
    inactiveScopeKey,
  };
}
