export const ACCOMMODATION_LIMITS = {
  MAX_FLOORS_PER_SETUP: 20,
  MAX_BEDS_PER_SETUP: 500,
  BEDS_WARNING_THRESHOLD: 400,
  MAX_ROOMS_PER_BULK: 50,
  MAX_UNITS_PER_BULK: 50,
  MAX_BEDS_PER_BULK_ROOMS: 500,
} as const;

export function validateBulkUnits(count: number): string | null {
  if (count < 1 || count > ACCOMMODATION_LIMITS.MAX_UNITS_PER_BULK) {
    return 'accommodation.bulk.errors.unitCount';
  }
  return null;
}

export function validateBulkRooms(
  count: number,
  bedsPerRoom: number,
): string | null {
  if (count < 1 || count > ACCOMMODATION_LIMITS.MAX_ROOMS_PER_BULK) {
    return 'accommodation.bulk.errors.roomCount';
  }
  if (bedsPerRoom < 0) {
    return 'accommodation.bulk.errors.bedsPerRoom';
  }
  const totalBeds = count * bedsPerRoom;
  if (totalBeds > ACCOMMODATION_LIMITS.MAX_BEDS_PER_BULK_ROOMS) {
    return 'accommodation.bulk.errors.maxBeds';
  }
  return null;
}

export function validateBulkBeds(count: number): string | null {
  if (count < 1) {
    return 'accommodation.bulk.errors.bedCount';
  }
  return null;
}

export function computeSetupBedTotal(params: {
  floors?: number;
  apartmentsPerFloor?: number;
  roomsPerFloor?: number;
  bedsPerRoom?: number;
  units?: number;
  roomsPerUnit?: number;
}): number {
  const {
    floors = 0,
    apartmentsPerFloor = 1,
    roomsPerFloor = 0,
    bedsPerRoom = 0,
    units = 0,
    roomsPerUnit = 0,
  } = params;

  if (floors > 0) {
    return floors * apartmentsPerFloor * roomsPerFloor * bedsPerRoom;
  }
  return units * roomsPerUnit * bedsPerRoom;
}
