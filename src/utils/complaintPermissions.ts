import type { ComplaintCategory, MembershipRole, SpaceType } from '../api/types';

const TENANT_CATEGORIES: ComplaintCategory[] = [
  'MAINTENANCE',
  'HOUSEKEEPING',
  'FOOD',
  'BILLING',
  'SAFETY',
  'OTHER',
];

const MESS_CATEGORIES: ComplaintCategory[] = [
  'FOOD_QUALITY',
  'FOOD_SERVICE',
  'BILLING',
  'SERVICE',
  'OTHER',
];

export function categoriesForSpaceType(spaceType: SpaceType | undefined): ComplaintCategory[] {
  if (spaceType === 'MESS') {
    return MESS_CATEGORIES;
  }
  return TENANT_CATEGORIES;
}

export function canManageComplaints(role: MembershipRole | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canRaiseComplaint(
  role: MembershipRole | undefined,
  permissionFlag?: boolean,
): boolean {
  if (permissionFlag === true) {
    return true;
  }
  return role === 'OWNER' || role === 'MANAGER' || role === 'TENANT' || role === 'CUSTOMER';
}
