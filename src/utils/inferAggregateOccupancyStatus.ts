import type { AccommodationStatus } from '../api/types';

/** Infer a single status color from aggregate bed counts. */
export function inferAggregateOccupancyStatus(params: {
  total: number;
  available?: number;
  occupied?: number;
  reserved?: number;
  maintenance?: number;
}): AccommodationStatus | null {
  const {
    total,
    available = 0,
    occupied = 0,
    reserved = 0,
    maintenance = 0,
  } = params;

  if (total <= 0) {
    return null;
  }

  if (maintenance > 0 && maintenance >= total) {
    return 'MAINTENANCE';
  }

  if (occupied >= total) {
    return 'OCCUPIED';
  }

  if (available >= total) {
    return 'AVAILABLE';
  }

  if (reserved > 0 && occupied === 0 && available === 0) {
    return 'RESERVED';
  }

  if (occupied > 0 && available === 0) {
    return 'OCCUPIED';
  }

  if (occupied > 0 || reserved > 0) {
    return 'RESERVED';
  }

  return 'AVAILABLE';
}

export function inferFloorListStatus(floor: {
  bedCount: number;
  available: number;
  occupied: number;
}): AccommodationStatus | null {
  return inferAggregateOccupancyStatus({
    total: floor.bedCount,
    available: floor.available,
    occupied: floor.occupied,
  });
}
