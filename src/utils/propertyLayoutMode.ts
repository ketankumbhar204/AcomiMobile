import type { PropertyLayoutMode, SpaceType } from '../api/types';

export const PG_LAYOUT_MODE_VALUES: PropertyLayoutMode[] = ['CORRIDOR_PG', 'APARTMENT_PG'];

export function layoutModesForSpaceType(spaceType: SpaceType): PropertyLayoutMode[] {
  switch (spaceType) {
    case 'PG':
    case 'HOSTEL':
      return PG_LAYOUT_MODE_VALUES;
    case 'CO_LIVING':
      return ['CO_LIVING'];
    case 'RENTAL':
      return ['RENTAL'];
    default:
      return [];
  }
}

export function isLayoutModeSelectable(spaceType: SpaceType): boolean {
  return spaceType === 'PG' || spaceType === 'HOSTEL';
}

export function getLayoutModeLabelKey(mode: PropertyLayoutMode): string {
  return `accommodation.layoutMode.${mode}`;
}

export function getLayoutModeDescriptionKey(mode: PropertyLayoutMode): string {
  return `accommodation.layoutMode.${mode}_desc`;
}
