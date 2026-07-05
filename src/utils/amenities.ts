import type { AmenityAssignment, SpaceType } from '../api/types';

export type AmenityCode =
  | 'WIFI'
  | 'FOOD_INCLUDED'
  | 'WASHING_MACHINE'
  | 'HOT_WATER'
  | 'PARKING'
  | 'REFRIGERATOR'
  | 'HOUSEKEEPING'
  | 'CCTV'
  | 'POWER_BACKUP'
  | 'RO_WATER'
  | 'CUSTOM';

export const PRESET_AMENITY_CODES: readonly AmenityCode[] = [
  'WIFI',
  'FOOD_INCLUDED',
  'WASHING_MACHINE',
  'HOT_WATER',
  'PARKING',
  'REFRIGERATOR',
  'HOUSEKEEPING',
  'CCTV',
  'POWER_BACKUP',
  'RO_WATER',
] as const;

export const MAX_SPACE_AMENITIES = 20;
export const MAX_CUSTOM_AMENITY_LABEL_LENGTH = 120;

export function supportsSpaceAmenities(spaceType: SpaceType | null | undefined): boolean {
  return spaceType === 'PG' || spaceType === 'HOSTEL' || spaceType === 'CO_LIVING';
}

export function amenityKey(amenity: AmenityAssignment): string {
  if (amenity.code === 'CUSTOM') {
    return `CUSTOM::${amenity.label.trim().toLowerCase()}`;
  }
  return amenity.code;
}

export function presetAmenityLabelKey(code: AmenityCode): string {
  return `spaces.amenities.codes.${code}`;
}

export function normalizeAmenityAssignments(
  amenities: AmenityAssignment[] | null | undefined,
): AmenityAssignment[] {
  if (!amenities?.length) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: AmenityAssignment[] = [];

  for (const raw of amenities) {
    if (!raw?.code?.trim()) {
      continue;
    }
    const code = raw.code.trim().toUpperCase() as AmenityCode;
    const label =
      code === 'CUSTOM'
        ? raw.label?.trim() ?? ''
        : raw.label?.trim() || code.replaceAll('_', ' ');
    if (code === 'CUSTOM' && !label) {
      continue;
    }
    const key = code === 'CUSTOM' ? `CUSTOM::${label.toLowerCase()}` : code;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push({ code, label });
    if (normalized.length >= MAX_SPACE_AMENITIES) {
      break;
    }
  }

  return normalized;
}

export function isAmenitySelected(
  available: AmenityAssignment[],
  assigned: AmenityAssignment[],
  amenity: AmenityAssignment,
): boolean {
  const assignedKeys = new Set(assigned.map(amenityKey));
  return assignedKeys.has(amenityKey(amenity));
}

export function toggleAssignedAmenity(
  available: AmenityAssignment[],
  assigned: AmenityAssignment[],
  amenity: AmenityAssignment,
): AmenityAssignment[] {
  const key = amenityKey(amenity);
  const exists = assigned.some(item => amenityKey(item) === key);
  if (exists) {
    return assigned.filter(item => amenityKey(item) !== key);
  }
  const match = available.find(item => amenityKey(item) === key) ?? amenity;
  return normalizeAmenityAssignments([...assigned, match]);
}

export function buildAllPresetAmenities(
  labelFor: (code: Exclude<AmenityCode, 'CUSTOM'>) => string,
): AmenityAssignment[] {
  return PRESET_AMENITY_CODES.map(code => ({
    code,
    label: labelFor(code),
  }));
}

export function defaultAssignedAmenities(spaceAmenities: AmenityAssignment[]): AmenityAssignment[] {
  return normalizeAmenityAssignments(spaceAmenities);
}
