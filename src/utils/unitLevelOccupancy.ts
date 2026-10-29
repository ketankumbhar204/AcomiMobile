import { accommodationApi } from '../api/accommodationApi';
import type { DashboardAccommodationOperations, UUID, UnitListItemResponse } from '../api/types';

export type UnitOccupancyCounts = {
  occupied: number;
  available: number;
  reserved: number;
};

export function countActiveUnitsByStatus(
  units: Array<Pick<UnitListItemResponse, 'status' | 'active'>>,
): UnitOccupancyCounts {
  const counts: UnitOccupancyCounts = { occupied: 0, available: 0, reserved: 0 };
  for (const unit of units) {
    if (unit.active === false) {
      continue;
    }
    if (unit.status === 'OCCUPIED') {
      counts.occupied += 1;
    } else if (unit.status === 'AVAILABLE') {
      counts.available += 1;
    } else if (unit.status === 'RESERVED') {
      counts.reserved += 1;
    }
  }
  return counts;
}

export function applyUnitOccupancyCounts<T extends DashboardAccommodationOperations>(
  operations: T,
  counts: UnitOccupancyCounts,
): T {
  return {
    ...operations,
    occupiedBeds: counts.occupied,
    vacantBeds: counts.available,
    reservedBeds: counts.reserved,
  };
}

async function listBuildingUnits(spaceId: UUID, buildingId: UUID): Promise<UnitListItemResponse[]> {
  const units: UnitListItemResponse[] = [];
  let page = 0;
  let total = Number.POSITIVE_INFINITY;
  while (units.length < total && page < 10) {
    const result = await accommodationApi.listUnits(spaceId, buildingId, {
      page,
      size: 100,
      includeSynthetic: false,
    });
    units.push(...result.content);
    total = result.totalElements;
    if (result.content.length === 0) {
      break;
    }
    page += 1;
  }
  return units;
}

/** Counts unit status for spaces whose profile has no rooms or beds. */
export async function loadUnitLevelOccupancyCounts(spaceId: UUID): Promise<UnitOccupancyCounts> {
  const buildings = await accommodationApi.getBuildings(spaceId);
  const pages = await Promise.all(
    buildings.map(building => listBuildingUnits(spaceId, building.buildingId).catch(() => [])),
  );
  return countActiveUnitsByStatus(pages.flat());
}
