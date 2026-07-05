import type { AccommodationStatus, UnitListItemResponse } from '../../../api/types';
import type { BedListItemResponse } from '../../../api/types';
import type { RoomListItemResponse } from '../../../api/types';
import type { BuildingSummaryResponse } from '../../../api/types';
import type { LayoutStatusCounts } from './cards/layoutSummaryTypes';
import { calcOccupancyPercent } from './cards/occupancyUtils';
import { filterActiveEntities } from '../../../utils/accommodationEntityActive';

export function buildingSummaryToStatusCounts(
  summary: BuildingSummaryResponse,
): LayoutStatusCounts {
  if (summary.beds > 0) {
    const occupied = summary.occupiedBeds ?? 0;
    const reserved = summary.reservedBeds ?? 0;
    const available =
      summary.availableBeds ??
      Math.max(0, summary.beds - occupied - reserved);
    return {
      available,
      occupied,
      reserved,
      maintenance: summary.maintenance ?? 0,
      blocked: summary.blocked ?? 0,
    };
  }

  if (summary.units > 0 && (summary.availableUnits != null || summary.occupiedUnits != null)) {
    return {
      available: summary.availableUnits ?? summary.available,
      occupied: summary.occupiedUnits ?? summary.occupied,
      reserved: summary.reservedUnits ?? summary.reserved,
      maintenance: summary.maintenance ?? 0,
      blocked: summary.blocked ?? 0,
    };
  }

  if (summary.rooms > 0 && (summary.availableRooms != null || summary.occupiedRooms != null)) {
    return {
      available: summary.availableRooms ?? summary.available,
      occupied: summary.occupiedRooms ?? summary.occupied,
      reserved: summary.reservedRooms ?? summary.reserved,
      maintenance: summary.maintenance ?? 0,
      blocked: summary.blocked ?? 0,
    };
  }

  return {
    available: summary.available,
    occupied: summary.occupied,
    reserved: summary.reserved,
    maintenance: summary.maintenance,
    blocked: summary.blocked,
  };
}

export function buildingSummaryOccupancyPercent(summary: BuildingSummaryResponse): number {
  const occupied = summary.occupiedBeds ?? summary.occupied;
  const total = summary.beds;
  return calcOccupancyPercent(occupied, total);
}

export function countUnitsByStatus(
  units: UnitListItemResponse[],
  status: AccommodationStatus,
): number {
  return units.filter(unit => unit.status === status).length;
}

export function aggregateUnitStatusCounts(units: UnitListItemResponse[]): LayoutStatusCounts {
  const activeUnits = filterActiveEntities(units);
  if (activeUnits.some(unit => unit.bedCount > 0 && unit.availableBeds !== undefined)) {
    return aggregateUnitBedStatusCounts(activeUnits);
  }
  return {
    available: countUnitsByStatus(activeUnits, 'AVAILABLE'),
    occupied: countUnitsByStatus(activeUnits, 'OCCUPIED'),
    reserved: countUnitsByStatus(activeUnits, 'RESERVED'),
    maintenance: countUnitsByStatus(activeUnits, 'MAINTENANCE'),
    blocked: countUnitsByStatus(activeUnits, 'BLOCKED'),
  };
}

export function aggregateUnitBedStatusCounts(units: UnitListItemResponse[]): LayoutStatusCounts {
  const activeUnits = filterActiveEntities(units);
  const available = activeUnits.reduce((sum, unit) => sum + (unit.availableBeds ?? 0), 0);
  const occupied = activeUnits.reduce((sum, unit) => sum + (unit.occupiedBeds ?? 0), 0);
  const reserved = activeUnits.reduce(
    (sum, unit) =>
      sum +
      Math.max(0, unit.bedCount - (unit.availableBeds ?? 0) - (unit.occupiedBeds ?? 0)),
    0,
  );
  return { available, occupied, reserved, maintenance: 0, blocked: 0 };
}

export function aggregateRoomBedStatusCounts(rooms: RoomListItemResponse[]): LayoutStatusCounts {
  const activeRooms = filterActiveEntities(rooms);
  const available = activeRooms.reduce((sum, room) => sum + room.availableBeds, 0);
  const occupied = activeRooms.reduce((sum, room) => sum + room.occupiedBeds, 0);
  const reserved = activeRooms.reduce(
    (sum, room) => sum + Math.max(0, room.bedCount - room.availableBeds - room.occupiedBeds),
    0,
  );
  return { available, occupied, reserved, maintenance: 0, blocked: 0 };
}

export function aggregateBedStatusCounts(beds: BedListItemResponse[]): LayoutStatusCounts {
  const activeBeds = filterActiveEntities(beds);
  const count = (status: AccommodationStatus) =>
    activeBeds.filter(bed => bed.status === status).length;
  return {
    available: count('AVAILABLE'),
    occupied: count('OCCUPIED'),
    reserved: count('RESERVED'),
    maintenance: count('MAINTENANCE'),
    blocked: count('BLOCKED'),
  };
}

export function countInactiveFromList<T extends { active?: boolean }>(items: T[]): number {
  return items.length - filterActiveEntities(items).length;
}
