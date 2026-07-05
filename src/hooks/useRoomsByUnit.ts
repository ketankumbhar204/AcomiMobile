import { useCallback, useMemo } from 'react';
import { accommodationApi } from '../api/accommodationApi';
import type { RoomListItemResponse, UUID } from '../api/types';
import { accommodationQueryKeys } from '../utils/accommodationQueryCache';
import { accommodationInactiveScopeKey } from '../utils/accommodationInactiveRegistry';
import { useAccommodationPagedList } from './useAccommodationPagedList';

export function useRoomsByUnit(
  spaceId: UUID | null,
  unitId: UUID | null,
  options?: { enabled?: boolean; searchQuery?: string },
) {
  const enabled = options?.enabled ?? Boolean(spaceId && unitId);
  const searchQuery = options?.searchQuery ?? '';

  const inactiveScopeKey = useMemo(
    () =>
      spaceId && unitId
        ? accommodationInactiveScopeKey('room', {
            spaceId,
            parentType: 'unit',
            parentId: unitId,
          })
        : null,
    [spaceId, unitId],
  );

  const fetchPage = useCallback(
    (params: Parameters<typeof accommodationApi.listRoomsByUnit>[2]) => {
      if (!spaceId || !unitId) {
        return Promise.reject(new Error('Missing spaceId or unitId'));
      }
      return accommodationApi.listRoomsByUnit(spaceId, unitId, params);
    },
    [spaceId, unitId],
  );

  const queryKey = useMemo(
    () =>
      spaceId && unitId
        ? accommodationQueryKeys.roomsByUnit(spaceId, unitId, { query: searchQuery })
        : (['rooms'] as const),
    [searchQuery, spaceId, unitId],
  );

  const result = useAccommodationPagedList(fetchPage, {
    enabled,
    searchQuery,
    errorKey: 'accommodation.errors.loadRooms',
    logTag: 'useRoomsByUnit',
    queryKey,
    sort: 'roomNumber',
    inactiveScopeKey,
    getItemId: item => item.roomId,
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
    patchRoom: (roomId: UUID, patch: Partial<RoomListItemResponse>) =>
      result.patchItems(item => item.roomId === roomId, patch),
    removeRoom: (roomId: UUID) => result.removeItems(item => item.roomId === roomId),
    inactiveScopeKey,
  };
}
