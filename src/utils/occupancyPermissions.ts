import type { MembershipRole } from '../api/types';

/** Workspace roles that may allocate, transfer, or vacate resident occupancies. */
export function canManageOccupancy(role: MembershipRole | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canViewSpaceOccupancies(role: MembershipRole | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER' || role === 'STAFF';
}

/** Whether the signed-in user may open occupancy UI on a member profile. */
export function canViewMemberOccupancy(role: MembershipRole | undefined): boolean {
  return (
    role === 'OWNER' ||
    role === 'MANAGER' ||
    role === 'STAFF' ||
    role === 'TENANT'
  );
}

/** Member roles that participate in accommodation occupancy (residents). */
const OCCUPANCY_MEMBER_ROLES: MembershipRole[] = ['TENANT', 'CUSTOMER', 'STAFF'];

/** Show the accommodation section on a member profile (based on the member's role). */
export function shouldShowOccupancySection(memberRole: MembershipRole | undefined): boolean {
  return memberRole != null && OCCUPANCY_MEMBER_ROLES.includes(memberRole);
}

/**
 * Allocate / transfer / vacate actions apply only to resident members and only
 * when the viewer is an owner or manager.
 */
export function canShowOccupancyActionsForMember(
  memberRole: MembershipRole | undefined,
  viewerRole: MembershipRole | undefined,
): boolean {
  if (!canManageOccupancy(viewerRole)) {
    return false;
  }
  if (memberRole === 'OWNER' || memberRole === 'MANAGER') {
    return false;
  }
  return shouldShowOccupancySection(memberRole);
}
