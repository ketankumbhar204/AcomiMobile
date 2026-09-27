/**
 * ACOMI representative-image assignment
 *
 * Shared algorithm with AcomiPublicWebsite `src/data/listings/representativeImage.ts`.
 * Keep the hash, category map, variant count, and real-photo rules identical.
 *
 * 1. Verified listing photo (http(s) or site-relative, not Unsplash / pack) wins.
 * 2. Else normalize spaceType → PG | HOSTEL | CO_LIVING | RENTAL | SERVICED | MESS | GENERIC.
 * 3. variantIndex = FNV-1a32(stableListingId) % 3
 *    If listing id is missing, hash the category (deterministic, never a random function).
 * 4. Pick `{slug}-{variantIndex+1}.png` from the local representative pack.
 *
 * These images are category-level visuals, never treated as property photos.
 */

import type { ImageSourcePropType } from 'react-native';

export const REPRESENTATIVE_VARIANT_COUNT = 3;

export type RepresentativeCategory =
  | 'PG'
  | 'HOSTEL'
  | 'CO_LIVING'
  | 'RENTAL'
  | 'SERVICED'
  | 'MESS'
  | 'GENERIC';

export type ListingCoverKind = 'listing' | 'representative';

export type ListingCoverInput = {
  listingId?: string | null;
  spaceType?: string | null;
  listingImageUrl?: string | null;
};

export type ListingCover = {
  kind: ListingCoverKind;
  category: RepresentativeCategory;
  variantIndex: number;
  imageKey: string;
  source: ImageSourcePropType;
};

const CATEGORY_SLUG: Record<RepresentativeCategory, string> = {
  PG: 'pg',
  HOSTEL: 'hostel',
  CO_LIVING: 'coliving',
  RENTAL: 'rental',
  SERVICED: 'serviced',
  MESS: 'mess',
  GENERIC: 'generic',
};

const REPRESENTATIVE_SOURCES: Record<string, ImageSourcePropType> = {
  'pg-1': require('../../assets/representative/pg-1.png'),
  'pg-2': require('../../assets/representative/pg-2.png'),
  'pg-3': require('../../assets/representative/pg-3.png'),
  'hostel-1': require('../../assets/representative/hostel-1.png'),
  'hostel-2': require('../../assets/representative/hostel-2.png'),
  'hostel-3': require('../../assets/representative/hostel-3.png'),
  'coliving-1': require('../../assets/representative/coliving-1.png'),
  'coliving-2': require('../../assets/representative/coliving-2.png'),
  'coliving-3': require('../../assets/representative/coliving-3.png'),
  'rental-1': require('../../assets/representative/rental-1.png'),
  'rental-2': require('../../assets/representative/rental-2.png'),
  'rental-3': require('../../assets/representative/rental-3.png'),
  'serviced-1': require('../../assets/representative/serviced-1.png'),
  'serviced-2': require('../../assets/representative/serviced-2.png'),
  'serviced-3': require('../../assets/representative/serviced-3.png'),
  'mess-1': require('../../assets/representative/mess-1.png'),
  'mess-2': require('../../assets/representative/mess-2.png'),
  'mess-3': require('../../assets/representative/mess-3.png'),
  'generic-1': require('../../assets/representative/generic-1.png'),
  'generic-2': require('../../assets/representative/generic-2.png'),
  'generic-3': require('../../assets/representative/generic-3.png'),
};

/** FNV-1a 32-bit. Do not replace with a random function. */
export function stableHash(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    // FNV-1a requires xor / unsigned shift.
    // eslint-disable-next-line no-bitwise
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // eslint-disable-next-line no-bitwise
  return hash >>> 0;
}

export function normalizeRepresentativeCategory(
  spaceType?: string | null,
): RepresentativeCategory {
  const key = (spaceType ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (key === 'PG') return 'PG';
  if (key === 'HOSTEL') return 'HOSTEL';
  if (key === 'CO_LIVING' || key === 'COLIVING') return 'CO_LIVING';
  if (key === 'RENTAL') return 'RENTAL';
  if (
    key === 'SERVICED' ||
    key === 'CORPORATE' ||
    key === 'SERVICED_APARTMENT' ||
    key === 'SERVICED_APARTMENTS' ||
    key === 'CORPORATE_APARTMENT' ||
    key === 'CORPORATE_APARTMENTS'
  ) {
    return 'SERVICED';
  }
  if (key === 'MESS' || key === 'TIFFIN') return 'MESS';
  return 'GENERIC';
}

export function representativeVariantIndex(
  listingId: string | null | undefined,
  category: RepresentativeCategory,
): number {
  const seed = listingId?.trim() || category;
  return stableHash(seed) % REPRESENTATIVE_VARIANT_COUNT;
}

export function representativeImageKey(
  category: RepresentativeCategory,
  variantIndex: number,
): string {
  return `${CATEGORY_SLUG[category]}-${variantIndex + 1}`;
}

export function isVerifiedListingImageUrl(url?: string | null): boolean {
  const value = url?.trim() ?? '';
  if (!value) return false;
  const lower = value.toLowerCase();
  if (lower.includes('/images/representative/')) return false;
  if (lower.includes('images.unsplash.com')) return false;
  if (lower.startsWith('representative:')) return false;
  return lower.startsWith('https://') || lower.startsWith('http://') || lower.startsWith('/');
}

export function firstVerifiedListingImageUrl(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  for (const candidate of candidates) {
    if (isVerifiedListingImageUrl(candidate)) {
      return candidate!.trim();
    }
  }
  return undefined;
}

export function resolveListingCover(input: ListingCoverInput): ListingCover {
  const category = normalizeRepresentativeCategory(input.spaceType);
  const variantIndex = representativeVariantIndex(input.listingId, category);
  const imageKey = representativeImageKey(category, variantIndex);
  const listingImageUrl = input.listingImageUrl?.trim();

  if (isVerifiedListingImageUrl(listingImageUrl)) {
    return {
      kind: 'listing',
      category,
      variantIndex,
      imageKey,
      source: { uri: listingImageUrl! },
    };
  }

  return {
    kind: 'representative',
    category,
    variantIndex,
    imageKey,
    source: REPRESENTATIVE_SOURCES[imageKey] ?? REPRESENTATIVE_SOURCES['generic-1'],
  };
}

/** Spec name — same as resolveListingCover without a real photo. */
export function getRepresentativeImage(
  spaceType: string | null | undefined,
  stableListingId: string | null | undefined,
): ListingCover {
  return resolveListingCover({ listingId: stableListingId, spaceType });
}
