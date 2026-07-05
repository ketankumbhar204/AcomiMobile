import type { ImageSourcePropType } from 'react-native';

export type AccommodationSpriteKey = 'floor' | 'room' | 'unit' | 'bed';
export type AccommodationPlanBgKey = 'building' | 'corridor' | 'apartment' | 'unit' | 'room';

export const accommodationLayoutAssets = {
  buildingBg: require('../../../../assets/accommodation/building-bg.png'),
  floorSprite: require('../../../../assets/accommodation/floor-sprite.png'),
  corridorBg: require('../../../../assets/accommodation/corridor-bg.png'),
  apartmentBg: require('../../../../assets/accommodation/apartment-bg.png'),
  unitBg: require('../../../../assets/accommodation/unit-bg.png'),
  roomBg: require('../../../../assets/accommodation/room-bg.png'),
  roomSprite: require('../../../../assets/accommodation/room-sprite.png'),
  unitSprite: require('../../../../assets/accommodation/unit-sprite.png'),
  bedSprite: require('../../../../assets/accommodation/bed-sprite.png'),
} as const;

const SPRITE_MAP: Record<AccommodationSpriteKey, ImageSourcePropType> = {
  floor: accommodationLayoutAssets.floorSprite,
  room: accommodationLayoutAssets.roomSprite,
  unit: accommodationLayoutAssets.unitSprite,
  bed: accommodationLayoutAssets.bedSprite,
};

const PLAN_BG_MAP: Record<AccommodationPlanBgKey, ImageSourcePropType> = {
  building: accommodationLayoutAssets.buildingBg,
  corridor: accommodationLayoutAssets.corridorBg,
  apartment: accommodationLayoutAssets.apartmentBg,
  unit: accommodationLayoutAssets.unitBg,
  room: accommodationLayoutAssets.roomBg,
};

export function getSpriteAsset(key: AccommodationSpriteKey): ImageSourcePropType {
  return SPRITE_MAP[key];
}

export function getPlanBgAsset(key: AccommodationPlanBgKey): ImageSourcePropType {
  return PLAN_BG_MAP[key];
}
