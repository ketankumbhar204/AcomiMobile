import type { SpaceType } from '../api/types';

/**
 * Default cover photos for discovery cards when the API has no images.
 * Same Unsplash source pattern as AcomiPublicWebsite listing photos.
 */
function listingPhoto(id: string, w = 900): string {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;
}

const DEFAULT_BY_TYPE: Record<SpaceType, string> = {
  PG: listingPhoto('photo-1555854877-bab0e564b8d5'),
  HOSTEL: listingPhoto('photo-1522708323590-d24dbb6b0267'),
  RENTAL: listingPhoto('photo-1560448204-e02f11c3d0e2'),
  CO_LIVING: listingPhoto('photo-1600596542815-ffad4c1539a9'),
  MESS: listingPhoto('photo-1742281258189-3b933879867a'),
};

const FALLBACK = listingPhoto('photo-1502672260266-1c1ef2d93688');

export function discoverDefaultImageUrl(type: SpaceType | string | undefined): string {
  if (type && type in DEFAULT_BY_TYPE) {
    return DEFAULT_BY_TYPE[type as SpaceType];
  }
  return FALLBACK;
}
