import type { ImageSourcePropType } from 'react-native';
import type { AccommodationStatus, PropertyLayoutMode } from '../../../../api/types';

/** Existing illustration library — do not generate or substitute icons. */
export const accommodationIllustrations = {
  building: require('../../../../assets/accommodation/illustrations/buildings/building.png'),
  floor: require('../../../../assets/accommodation/illustrations/floors/floor.png'),
  corridorFloor: require('../../../../assets/accommodation/illustrations/floors/corridor_floor.png'),
  unitSmall: require('../../../../assets/accommodation/illustrations/units/small_unit.png'),
  unitMedium: require('../../../../assets/accommodation/illustrations/units/unit_medium.png'),
  unitLarge: require('../../../../assets/accommodation/illustrations/units/unit_large.png'),
  roomSingle: require('../../../../assets/accommodation/illustrations/rooms/room_single.png'),
  roomDouble: require('../../../../assets/accommodation/illustrations/rooms/room_double.png'),
  roomTriple: require('../../../../assets/accommodation/illustrations/rooms/room_tripple.png'),
  roomQuad: require('../../../../assets/accommodation/illustrations/rooms/room_qaud.png'),
  roomFiveBeds: require('../../../../assets/accommodation/illustrations/rooms/room_five_beds.png'),
  roomSixBeds: require('../../../../assets/accommodation/illustrations/rooms/room_six_bed.png'),
  bedAvailable: require('../../../../assets/accommodation/illustrations/beds/bed-available.png'),
  bedReserved: require('../../../../assets/accommodation/illustrations/beds/bed-reserved.png'),
  bedOccupied: require('../../../../assets/accommodation/illustrations/beds/bed-occupied.png'),
  bedMaintenance: require('../../../../assets/accommodation/illustrations/beds/bed-maintenance.png'),
} as const;

export function getBuildingIllustration(): ImageSourcePropType {
  return accommodationIllustrations.building;
}

export function getFloorIllustration(layoutMode?: PropertyLayoutMode | string): ImageSourcePropType {
  if (layoutMode === 'CORRIDOR_PG') {
    return accommodationIllustrations.corridorFloor;
  }
  return accommodationIllustrations.floor;
}

export function getUnitIllustration(roomCount: number, bedCount: number): ImageSourcePropType {
  if (roomCount <= 4 || bedCount <= 20) {
    return accommodationIllustrations.unitSmall;
  }
  if (roomCount <= 8 || bedCount <= 40) {
    return accommodationIllustrations.unitMedium;
  }
  return accommodationIllustrations.unitLarge;
}

export function getRoomIllustration(capacity: number): ImageSourcePropType {
  switch (capacity) {
    case 1:
      return accommodationIllustrations.roomSingle;
    case 2:
      return accommodationIllustrations.roomDouble;
    case 3:
      return accommodationIllustrations.roomTriple;
    case 4:
      return accommodationIllustrations.roomQuad;
    case 5:
      return accommodationIllustrations.roomFiveBeds;
    default:
      return accommodationIllustrations.roomSixBeds;
  }
}

export function getBedIllustration(status: AccommodationStatus): ImageSourcePropType {
  switch (status) {
    case 'AVAILABLE':
      return accommodationIllustrations.bedAvailable;
    case 'RESERVED':
      return accommodationIllustrations.bedReserved;
    case 'OCCUPIED':
      return accommodationIllustrations.bedOccupied;
    case 'MAINTENANCE':
    case 'BLOCKED':
      return accommodationIllustrations.bedMaintenance;
    default:
      return accommodationIllustrations.bedAvailable;
  }
}
