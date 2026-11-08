import type { OccupancyListFilters, UUID } from '../api/types';
import { invalidateAccommodationQueries } from './accommodationQueryCache';
import { invalidateDashboardQueries } from './dashboardQueryCache';
import { publishPaymentsMonthChanged } from './paymentUpdates';
import { invalidateStayPaymentCache } from './stayChargeIndex';

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

/**
 * Refresh occupancy, bed cards, dashboard, the bed stay-charge index, and the
 * owner payment month lists. Pass the space id so payment screens reload.
 * Query names: occupancy listener, accommodation lists, dashboard, stay-charge
 * index, and owner/tenant payment month caches (`summary|spaceId|month`).
 */
export function invalidateAfterOccupancyChange(spaceId?: string): void {
  invalidateOccupancyQueries();
  invalidateAccommodationQueries();
  invalidateDashboardQueries();
  invalidateStayPaymentCache();
  if (spaceId) {
    publishPaymentsMonthChanged(spaceId);
  }
}
