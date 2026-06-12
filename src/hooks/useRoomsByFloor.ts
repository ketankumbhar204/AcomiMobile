import { useCallback, useMemo } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { UUID } from '../api/types';
import { accommodationQueryKeys } from '../utils/accommodationQueryCache';
import { useAccommodationPagedList } from './useAccommodationPagedList';

export function useRoomsByFloor(
  spaceId: UUID | null,
  floorId: UUID | null,
  options?: { enabled?: boolean; searchQuery?: string },
) {
  const enabled = options?.enabled ?? Boolean(spaceId && floorId);
  const searchQuery = options?.searchQuery ?? '';

  const fetchPage = useCallback(
    (params: Parameters<typeof accommodationApi.listRoomsByFloor>[2]) => {
      if (!spaceId || !floorId) {
        return Promise.reject(new Error('Missing spaceId or floorId'));
      }
      return accommodationApi.listRoomsByFloor(spaceId, floorId, params);
    },
    [floorId, spaceId],
  );

  const queryKey = useMemo(
    () =>
      spaceId && floorId
        ? accommodationQueryKeys.roomsByFloor(spaceId, floorId, { query: searchQuery })
        : (['rooms'] as const),
    [floorId, searchQuery, spaceId],
  );

  const result = useAccommodationPagedList(fetchPage, {
    enabled,
    searchQuery,
    errorKey: 'accommodation.errors.loadRooms',
    logTag: 'useRoomsByFloor',
    queryKey,
    sort: 'roomNumber',
  });

  return {
    rooms: result.items,
    loading: result.loading,
    loadingMore: result.loadingMore,
    error: result.error,
    hasMore: result.hasMore,
    totalElements: result.totalElements,
    refresh: result.refresh,
    loadMore: result.loadMore,
  };
}
