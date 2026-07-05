import type { OccupancyListFilters, UUID } from '../api/types';
import { invalidateAccommodationQueries } from './accommodationQueryCache';
import { invalidateDashboardQueries } from './dashboardQueryCache';

export const occupancyKeys = {
  detail: (spaceId: UUID, occupancyId: UUID) =>
    ['occupancy', spaceId, occupancyId] as const,
  list: (spaceId: UUID, filters?: OccupancyListFilters) =>
    ['occupancy', spaceId, 'list', filters ?? {}] as const,
  member: (spaceId: UUID, memberId: UUID) =>
    ['occupancy', spaceId, 'member', memberId] as const,
};

type InvalidationListener = () => void;

let invalidationGeneration = 0;
const listeners = new Set<InvalidationListener>();

export function getOccupancyInvalidationGeneration(): number {
  return invalidationGeneration;
}

export function invalidateOccupancyQueries(): void {
  invalidationGeneration += 1;
  listeners.forEach(listener => listener());
}

export function subscribeOccupancyInvalidation(listener: InvalidationListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Refresh accommodation lists/summary and occupancy caches after allocate/transfer/vacate. */
export function invalidateAfterOccupancyChange(): void {
  invalidateOccupancyQueries();
  invalidateAccommodationQueries();
  invalidateDashboardQueries();
}
