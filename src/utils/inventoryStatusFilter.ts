import type { AccommodationStatus, BedSpaceListItemResponse } from '../api/types';
import { groupBedsByRoom, type BedRoomGroup } from './groupBedsByRoom';

export type InventoryStatusFilter = 'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export type InventoryStatusCounts = {
  all: number;
  available: number;
  occupied: number;
  reserved: number;
};

/** Counts beds by inventory status within the current search/building scope. */
export function countBedsByInventoryStatus(
  beds: readonly BedSpaceListItemResponse[],
): InventoryStatusCounts {
  const counts: InventoryStatusCounts = {
    all: beds.length,
    available: 0,
    occupied: 0,
    reserved: 0,
  };
  for (const bed of beds) {
    if (bed.status === 'AVAILABLE') {
      counts.available += 1;
    } else if (bed.status === 'OCCUPIED') {
      counts.occupied += 1;
    } else if (bed.status === 'RESERVED') {
      counts.reserved += 1;
    }
  }
  return counts;
}

export function filterBedsByInventoryStatus(
  beds: readonly BedSpaceListItemResponse[],
  filter: InventoryStatusFilter,
): BedSpaceListItemResponse[] {
  if (filter === 'ALL') {
    return [...beds];
  }
  return beds.filter(bed => bed.status === filter);
}

/**
 * Group beds by room, then keep only rooms that still have matching beds.
 * Matching beds are the only beds shown inside each room.
 */
export function filterRoomGroupsByInventoryStatus(
  beds: readonly BedSpaceListItemResponse[],
  filter: InventoryStatusFilter,
): BedRoomGroup[] {
  return groupBedsByRoom(filterBedsByInventoryStatus(beds, filter));
}

export function roomGroupOccupiedCount(group: BedRoomGroup): number {
  return group.beds.filter(bed => bed.status === 'OCCUPIED').length;
}

export function roomGroupReservedCount(group: BedRoomGroup): number {
  return group.beds.filter(bed => bed.status === 'RESERVED').length;
}

export function roomGroupStatusSummaryLabel(
  group: BedRoomGroup,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const total = group.beds.length;
  const occupied = roomGroupOccupiedCount(group);
  const available = group.beds.filter(bed => bed.status === 'AVAILABLE').length;
  const reserved = roomGroupReservedCount(group);

  if (total === 0) {
    return t('accommodation.builder.noBeds', { defaultValue: 'No beds' });
  }
  if (occupied === total) {
    return t('accommodation.builder.roomOccupiedSummary', {
      occupied,
      total,
      defaultValue: '{{occupied}} / {{total}} Occupied',
    });
  }
  if (available === total) {
    return t('accommodation.builder.roomAvailableSummary', {
      available,
      total,
      defaultValue: '{{available}} / {{total}} Available',
    });
  }
  if (reserved === total) {
    return t('accommodation.builder.roomReservedSummary', {
      reserved,
      total,
      defaultValue: '{{reserved}} / {{total}} Reserved',
    });
  }
  return t('accommodation.builder.roomMixedSummary', {
    occupied,
    total,
    defaultValue: '{{occupied}} / {{total}} Occupied',
  });
}

export function inventoryStatusToApi(
  filter: InventoryStatusFilter,
): AccommodationStatus | undefined {
  if (filter === 'ALL') {
    return undefined;
  }
  return filter;
}
