import type { AccommodationStatus } from '../api/types';

export type BedOccupancyActionSet =
  | 'allocate-reserve'
  | 'moveIn-cancel'
  | 'transfer-vacate'
  | 'none';

export function occupancyActionsForBedStatus(
  status: AccommodationStatus | undefined,
  inactive = false,
): BedOccupancyActionSet {
  if (inactive || status == null) {
    return 'none';
  }
  if (status === 'MAINTENANCE' || status === 'BLOCKED') {
    return 'none';
  }
  if (status === 'AVAILABLE') {
    return 'allocate-reserve';
  }
  if (status === 'RESERVED') {
    return 'moveIn-cancel';
  }
  if (status === 'OCCUPIED') {
    return 'transfer-vacate';
  }
  return 'none';
}
