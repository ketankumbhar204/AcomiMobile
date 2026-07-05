import type { ImageSourcePropType } from 'react-native';
import type { AccommodationStatus } from '../../../../api/types';
import { getBedIllustration } from '../illustrations/illustrationAssets';

export const accommodationSprites = {
  bed: require('../../../../assets/accommodation/sprites/bed.png'),
  roomSlot: require('../../../../assets/accommodation/sprites/room-slot.png'),
  unitSlot: require('../../../../assets/accommodation/sprites/unit-slot.png'),
  buildingShell: require('../../../../assets/accommodation/sprites/building-shell.png'),
  doorFront: require('../../../../assets/accommodation/sprites/door-front.png'),
  entranceDoors: require('../../../../assets/accommodation/sprites/entrance-doors.png'),
  plantPot: require('../../../../assets/accommodation/sprites/plant-pot.png'),
  balconyRailing: require('../../../../assets/accommodation/sprites/balcony-railing.png'),
  floorPlanFourUnits: require('../../../../assets/accommodation/sprites/floor-plan-four-units.png'),
  roomInteriorShell: require('../../../../assets/accommodation/sprites/room-interior-shell.png'),
} as const;

export type AccommodationSpriteAsset = keyof typeof accommodationSprites;

export function getAccommodationSprite(key: AccommodationSpriteAsset): ImageSourcePropType {
  return accommodationSprites[key];
}

export function getBedSpriteForStatus(status: AccommodationStatus): ImageSourcePropType {
  return getBedIllustration(status);
}
