import { occupancyApi } from '../api/occupancyApi';
import { paymentsApi } from '../api/paymentsApi';
import type { OccupancyResponse, SpacePaymentResponse, UUID } from '../api/types';
import {
  selectStayCharges,
  summarizeStayCharges,
  type OccupantPaymentSummary,
} from './occupantPaymentSummary';

export type StayChargeIndex = {
  month: string;
  occupancyByBed: Map<string, OccupancyResponse>;
  /** Unit-only stays. A stay that also has a bed stays on the bed index. */
  occupancyByUnit: Map<string, OccupancyResponse>;
  payments: SpacePaymentResponse[];
};

let revision = 0;
const listeners = new Set<() => void>();
const cache = new Map<string, { revision: number; promise: Promise<StayChargeIndex> }>();

export function currentStayMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function invalidateStayPaymentCache(): void {
  revision += 1;
  cache.clear();
  listeners.forEach(listener => listener());
}

export function subscribeStayPaymentCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function stayPaymentRevision(): number {
  return revision;
}

export function loadStayChargeIndex(spaceId: UUID, month = currentStayMonth()): Promise<StayChargeIndex> {
  const key = `${spaceId}:${month}`;
  const hit = cache.get(key);
  if (hit && hit.revision === revision) {
    return hit.promise;
  }
  const promise = Promise.all([
    occupancyApi.listOccupancies(spaceId, { status: 'ACTIVE', size: 500 }),
    paymentsApi.listStayCharges(spaceId, month),
  ]).then(([occupancies, charges]) => {
    const occupancyByBed = new Map<string, OccupancyResponse>();
    const occupancyByUnit = new Map<string, OccupancyResponse>();
    for (const occupancy of occupancies.content) {
      if (occupancy.status !== 'ACTIVE') {
        continue;
      }
      if (occupancy.bedId) {
        occupancyByBed.set(occupancy.bedId, occupancy);
      } else if (occupancy.unitId) {
        occupancyByUnit.set(occupancy.unitId, occupancy);
      }
    }
    return {
      month: charges.month || month,
      occupancyByBed,
      occupancyByUnit,
      payments: charges.payments,
    };
  });
  cache.set(key, { revision, promise });
  promise.catch(() => {
    const current = cache.get(key);
    if (current?.promise === promise) {
      cache.delete(key);
    }
  });
  return promise;
}

export function summaryForUnit(
  index: StayChargeIndex,
  unitId: string,
): { occupancy: OccupancyResponse | null; summary: OccupantPaymentSummary } {
  return summaryForOccupancy(index, index.occupancyByUnit.get(unitId) ?? null);
}

export function summaryForBed(
  index: StayChargeIndex,
  bedId: string,
): { occupancy: OccupancyResponse | null; summary: OccupantPaymentSummary } {
  return summaryForOccupancy(index, index.occupancyByBed.get(bedId) ?? null);
}

function summaryForOccupancy(
  index: StayChargeIndex,
  occupancy: OccupancyResponse | null,
): { occupancy: OccupancyResponse | null; summary: OccupantPaymentSummary } {
  if (!occupancy) {
    return {
      occupancy: null,
      summary: summarizeStayCharges([], index.month),
    };
  }
  return {
    occupancy,
    summary: summarizeStayCharges(
      selectStayCharges(index.payments, occupancy.occupancyId, index.month),
      index.month,
    ),
  };
}
