import type { ListQueryParams, UUID } from '../api/types';
import { devLog } from './devLog';

/** Query-key helpers (React Query–style) for accommodation list caches. */
export const accommodationQueryKeys = {
  buildings: (spaceId: UUID) => ['buildings', spaceId] as const,

  buildingSummary: (spaceId: UUID, buildingId: UUID) =>
    ['accommodation', spaceId, 'building', buildingId, 'summary'] as const,

  floors: (spaceId: UUID, buildingId: UUID, params?: ListQueryParams) =>
    ['accommodation', spaceId, 'building', buildingId, 'floors', params ?? {}] as const,

  units: (spaceId: UUID, buildingId: UUID, params?: ListQueryParams) =>
    ['accommodation', spaceId, 'building', buildingId, 'units', params ?? {}] as const,

  unitsByFloor: (
    spaceId: UUID,
    buildingId: UUID,
    floorId: UUID,
    params?: ListQueryParams,
  ) =>
    [
      'accommodation',
      spaceId,
      'building',
      buildingId,
      'floor',
      floorId,
      'units',
      params ?? {},
    ] as const,

  roomsByFloor: (spaceId: UUID, floorId: UUID, params?: ListQueryParams) =>
    ['accommodation', spaceId, 'floor', floorId, 'rooms', params ?? {}] as const,

  roomsByUnit: (spaceId: UUID, unitId: UUID, params?: ListQueryParams) =>
    ['accommodation', spaceId, 'unit', unitId, 'rooms', params ?? {}] as const,

  /** @deprecated Use roomsByFloor */
  rooms: (spaceId: UUID, floorId: UUID, params?: ListQueryParams) =>
    accommodationQueryKeys.roomsByFloor(spaceId, floorId, params),

  beds: (spaceId: UUID, roomId: UUID, params?: ListQueryParams) =>
    ['accommodation', spaceId, 'room', roomId, 'beds', params ?? {}] as const,

  searchFloors: (spaceId: UUID, query: string, params?: ListQueryParams) =>
    ['accommodation', spaceId, 'search', 'floors', query, params ?? {}] as const,

  searchUnits: (spaceId: UUID, query: string, params?: ListQueryParams) =>
    ['accommodation', spaceId, 'search', 'units', query, params ?? {}] as const,

  searchRooms: (spaceId: UUID, query: string, params?: ListQueryParams) =>
    ['accommodation', spaceId, 'search', 'rooms', query, params ?? {}] as const,
};

type InvalidationListener = () => void;

let invalidationGeneration = 0;
const listeners = new Set<InvalidationListener>();

export function getAccommodationInvalidationGeneration(): number {
  return invalidationGeneration;
}

export function invalidateAccommodationQueries(): void {
  invalidationGeneration += 1;
  devLog('[accommodationQueryCache] invalidate all', invalidationGeneration);
  listeners.forEach(listener => listener());
}

export function subscribeAccommodationInvalidation(
  listener: InvalidationListener,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function queryKeyLabel(key: readonly unknown[]): string {
  return key.map(part => (typeof part === 'object' ? JSON.stringify(part) : String(part))).join('/');
}
