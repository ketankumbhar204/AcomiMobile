import type { GenderPolicy, SpaceType } from '../api/types';

export const PROPERTY_CATEGORY_VALUES: readonly GenderPolicy[] = [
  'MALE',
  'FEMALE',
  'MIXED',
] as const;

export function supportsSpacePropertyCategory(
  spaceType: SpaceType | null | undefined,
): boolean {
  return spaceType === 'PG' || spaceType === 'HOSTEL' || spaceType === 'CO_LIVING';
}

export function propertyCategoryLabelKey(
  spaceType: SpaceType,
  policy: GenderPolicy,
): string {
  const typeKey =
    spaceType === 'PG' ? 'pg' : spaceType === 'HOSTEL' ? 'hostel' : 'coLiving';
  const policyKey =
    policy === 'MALE' ? 'gents' : policy === 'FEMALE' ? 'ladies' : 'mixed';
  return `spaces.propertyCategory.${typeKey}.${policyKey}`;
}
