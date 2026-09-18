import type { FilePurpose } from '../api/filesApi';

export type EntityPhotoKind =
  | 'space'
  | 'building'
  | 'floor'
  | 'unit'
  | 'room'
  | 'bed'
  | 'menuItem'
  | 'combo';

export const ENTITY_PHOTO_PURPOSE: Record<EntityPhotoKind, FilePurpose> = {
  space: 'SPACE_PHOTO',
  building: 'BUILDING_PHOTO',
  floor: 'FLOOR_PHOTO',
  unit: 'UNIT_PHOTO',
  room: 'ROOM_PHOTO',
  bed: 'BED_PHOTO',
  menuItem: 'MENU_ITEM_PHOTO',
  combo: 'COMBO_PHOTO',
};

export function canEditEntityPhoto(membershipRole?: string | null): boolean {
  return membershipRole === 'OWNER';
}
