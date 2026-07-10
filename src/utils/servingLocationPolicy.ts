import type { SpaceType } from '../api/types';

export type ServingLocationMode = 'delivery' | 'property' | 'hidden';

const ACCOMMODATION_TYPES: SpaceType[] = ['PG', 'HOSTEL', 'CO_LIVING'];

export function servingLocationMode(spaceType?: SpaceType): ServingLocationMode {
  if (spaceType === 'MESS') {
    return 'delivery';
  }
  if (spaceType != null && ACCOMMODATION_TYPES.includes(spaceType)) {
    return 'property';
  }
  return 'hidden';
}

export function showsServingLocationSection(mode: ServingLocationMode): boolean {
  return mode !== 'hidden';
}

export function usesDeliveryLocations(mode: ServingLocationMode): boolean {
  return mode === 'delivery';
}

export function usesPropertyServingLocation(mode: ServingLocationMode): boolean {
  return mode === 'property';
}
