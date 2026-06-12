import type { MembershipRole } from '../api/types';

export function canViewAccommodation(_role: MembershipRole | undefined): boolean {
  return true;
}

export function canCreateOrUpdateAccommodation(
  role: MembershipRole | undefined,
): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

/** Phase 4.2 orchestration: Quick Setup, duplicate, bulk */
export function canManageAccommodation(
  role: MembershipRole | undefined,
): boolean {
  return canCreateOrUpdateAccommodation(role);
}

export function canDeactivateAccommodation(
  role: MembershipRole | undefined,
): boolean {
  return role === 'OWNER';
}
