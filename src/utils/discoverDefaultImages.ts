import { resolveListingCover } from './representativeImage';

/** Prefer DiscoverListingCover / resolveListingCover at the call site. */
export function discoverDefaultImageUrl(
  type: string | undefined,
  listingId?: string | null,
) {
  return resolveListingCover({ listingId, spaceType: type });
}
