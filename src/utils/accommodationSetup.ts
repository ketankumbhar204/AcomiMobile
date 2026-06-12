import type {
  AccommodationSetupRequest,
  PgHostelSetupConfig,
  PropertyLayoutMode,
  SpaceType,
  UnitSetupConfig,
  BuildingSetupInput,
} from '../api/types';
import { defaultLayoutModeForSpaceType } from './accommodationProfile';
import { ACCOMMODATION_LIMITS, computeSetupBedTotal } from './accommodationLimits';

export function buildSetupRequest(
  spaceType: SpaceType,
  building: BuildingSetupInput,
  pgHostel?: PgHostelSetupConfig,
  units?: UnitSetupConfig,
  layoutMode?: PropertyLayoutMode,
): AccommodationSetupRequest {
  const req: AccommodationSetupRequest = {
    spaceType,
    building,
    layoutMode: layoutMode ?? defaultLayoutModeForSpaceType(spaceType),
  };
  if (spaceType === 'PG' || spaceType === 'HOSTEL') {
    req.floors = pgHostel;
  } else if (spaceType === 'CO_LIVING' || spaceType === 'RENTAL') {
    req.units = units;
  }
  return req;
}

export function validatePgHostelSetup(
  floors: PgHostelSetupConfig,
  layoutMode: PropertyLayoutMode = 'CORRIDOR_PG',
): string | null {
  if (floors.count < 1 || floors.count > ACCOMMODATION_LIMITS.MAX_FLOORS_PER_SETUP) {
    return 'accommodation.setup.errors.floorCount';
  }
  if (layoutMode === 'APARTMENT_PG') {
    if (!floors.apartmentsPerFloor || floors.apartmentsPerFloor < 1) {
      return 'accommodation.setup.errors.apartmentsPerFloor';
    }
  }
  if (floors.roomsPerFloor < 1 || floors.bedsPerRoom < 1 || floors.capacityPerRoom < 1) {
    return 'accommodation.setup.errors.roomBedCounts';
  }
  const beds =
    layoutMode === 'APARTMENT_PG'
      ? floors.count *
        (floors.apartmentsPerFloor ?? 0) *
        floors.roomsPerFloor *
        floors.bedsPerRoom
      : computeSetupBedTotal({
          floors: floors.count,
          roomsPerFloor: floors.roomsPerFloor,
          bedsPerRoom: floors.bedsPerRoom,
        });
  if (beds > ACCOMMODATION_LIMITS.MAX_BEDS_PER_SETUP) {
    return 'accommodation.setup.errors.maxBeds';
  }
  return null;
}

export function validateCoLivingSetup(units: UnitSetupConfig): string | null {
  if (units.count < 1) {
    return 'accommodation.setup.errors.unitCount';
  }
  if (!units.roomsPerUnit || units.roomsPerUnit < 1) {
    return 'accommodation.setup.errors.roomsPerUnit';
  }
  if (!units.bedsPerRoom || units.bedsPerRoom < 1) {
    return 'accommodation.setup.errors.bedsPerRoom';
  }
  if (!units.defaultRoomType) {
    return 'accommodation.setup.errors.roomType';
  }
  if (!units.capacityPerRoom || units.capacityPerRoom < 1) {
    return 'accommodation.setup.errors.capacity';
  }
  const beds = computeSetupBedTotal({
    units: units.count,
    roomsPerUnit: units.roomsPerUnit,
    bedsPerRoom: units.bedsPerRoom,
  });
  if (beds > ACCOMMODATION_LIMITS.MAX_BEDS_PER_SETUP) {
    return 'accommodation.setup.errors.maxBeds';
  }
  return null;
}

export function validateRentalSetup(units: UnitSetupConfig): string | null {
  if (units.count < 1) {
    return 'accommodation.setup.errors.unitCount';
  }
  if (units.count > ACCOMMODATION_LIMITS.MAX_UNITS_PER_BULK) {
    return 'accommodation.setup.errors.maxUnits';
  }
  return null;
}

export function generateIdempotencyKey(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
