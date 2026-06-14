import type {
  MembershipRole,
  SpacePermissionsResponse,
  UUID,
} from '../api/types';
import { deriveSpacePermissions } from './spacePermissions';

/** Workspace roles that may allocate, transfer, or vacate resident occupancies. */
export function canManageOccupancy(
  role: MembershipRole | undefined,
  permissions?: SpacePermissionsResponse,
): boolean {
  if (permissions) {
    return permissions.canManageOccupancy;
  }
  return role === 'OWNER' || role === 'MANAGER';
}

export function canViewSpaceOccupancies(
  role: MembershipRole | undefined,
  permissions?: SpacePermissionsResponse,
): boolean {
  if (permissions) {
    return permissions.canViewSpaceOccupancies;
  }
  return role === 'OWNER' || role === 'MANAGER' || role === 'STAFF';
}

/** Whether ops roles may open occupancy UI on member profiles. TENANT uses own-scope helper. */
export function canViewMemberOccupancy(
  role: MembershipRole | undefined,
  permissions?: SpacePermissionsResponse,
): boolean {
  if (role === 'CUSTOMER' || role === 'TENANT') {
    return false;
  }
  if (permissions) {
    return permissions.canViewSpaceOccupancies;
  }
  return role === 'OWNER' || role === 'MANAGER' || role === 'STAFF';
}

/** Member roles that participate in accommodation occupancy (residents). */
const OCCUPANCY_MEMBER_ROLES: MembershipRole[] = ['TENANT', 'CUSTOMER', 'STAFF'];

/** Show the accommodation section on a member profile (based on the member's role). */
export function shouldShowOccupancySection(memberRole: MembershipRole | undefined): boolean {
  return memberRole != null && OCCUPANCY_MEMBER_ROLES.includes(memberRole);
}

/**
 * TENANT may view occupancy only for their linked member record.
 * CUSTOMER cannot view occupancy data.
 */
export function canViewMemberOccupancyForProfile(
  memberRole: MembershipRole | undefined,
  memberLinkedUserId: UUID | null | undefined,
  viewerRole: MembershipRole | undefined,
  viewerUserId: UUID | null | undefined,
  permissions?: SpacePermissionsResponse,
): boolean {
  if (memberRole === 'CUSTOMER' || viewerRole === 'CUSTOMER') {
    return false;
  }

  if (viewerRole === 'TENANT') {
    return (
      memberLinkedUserId != null &&
      viewerUserId != null &&
      memberLinkedUserId === viewerUserId
    );
  }

  if (!shouldShowOccupancySection(memberRole)) {
    return viewerRole === 'OWNER' || viewerRole === 'MANAGER' || viewerRole === 'STAFF';
  }

  return canViewMemberOccupancy(viewerRole, permissions);
}

/**
 * Allocate / transfer / vacate actions apply only to resident members and only
 * when the viewer is an owner or manager.
 */
export function canShowOccupancyActionsForMember(
  memberRole: MembershipRole | undefined,
  viewerRole: MembershipRole | undefined,
  permissions?: SpacePermissionsResponse,
): boolean {
  if (!canManageOccupancy(viewerRole, permissions)) {
    return false;
  }
  if (memberRole === 'OWNER' || memberRole === 'MANAGER') {
    return false;
  }
  return shouldShowOccupancySection(memberRole);
}

export function canManageMembers(
  role: MembershipRole | undefined,
  permissions?: SpacePermissionsResponse,
): boolean {
  if (permissions) {
    return permissions.canManageMembers;
  }
  return deriveSpacePermissions(role, undefined).canManageMembers;
}

export function canRemoveMembers(
  role: MembershipRole | undefined,
  permissions?: SpacePermissionsResponse,
): boolean {
  if (permissions) {
    return permissions.canRemoveMember;
  }
  return deriveSpacePermissions(role, undefined).canRemoveMember;
}
