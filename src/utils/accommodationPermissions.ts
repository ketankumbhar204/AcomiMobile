import type { MembershipRole, SpacePermissionsResponse, SpaceType } from '../api/types';
import { isAccommodationApplicable } from './accommodationProfile';
import { deriveSpacePermissions } from './spacePermissions';

export function canViewAccommodation(
  role: MembershipRole | undefined,
  spaceType?: SpaceType,
  permissions?: SpacePermissionsResponse,
): boolean {
  if (permissions) {
    return permissions.canViewAccommodation;
  }
  return deriveSpacePermissions(role, spaceType).canViewAccommodation;
}

export function canCreateOrUpdateAccommodation(
  role: MembershipRole | undefined,
  permissions?: SpacePermissionsResponse,
): boolean {
  if (permissions) {
    return permissions.canManageAccommodation;
  }
  return role === 'OWNER' || role === 'MANAGER';
}

/** Phase 4.2 orchestration: Quick Setup, duplicate, bulk */
export function canManageAccommodation(
  role: MembershipRole | undefined,
  spaceType?: SpaceType,
  permissions?: SpacePermissionsResponse,
): boolean {
  if (permissions) {
    return permissions.canManageAccommodation;
  }
  if (spaceType && !isAccommodationApplicable(spaceType)) {
    return false;
  }
  return canCreateOrUpdateAccommodation(role);
}

export function canDeactivateAccommodation(
  role: MembershipRole | undefined,
  permissions?: SpacePermissionsResponse,
): boolean {
  if (permissions) {
    return permissions.canDeactivateAccommodation;
  }
  return role === 'OWNER';
}
