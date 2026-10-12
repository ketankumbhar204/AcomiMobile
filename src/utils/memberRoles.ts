import type { MembershipRole, SpaceType } from '../api/types';

/** Roles that can be assigned when adding or inviting a member. */
export function assignableRolesForSpaceType(
  spaceType: SpaceType | undefined,
): MembershipRole[] {
  if (spaceType === 'MESS') {
    return ['CUSTOMER', 'STAFF', 'MANAGER'];
  }
  return ['TENANT', 'CUSTOMER', 'STAFF', 'MANAGER'];
}

export function defaultRoleForSpaceType(
  spaceType: SpaceType | undefined,
): MembershipRole {
  return spaceType === 'MESS' ? 'CUSTOMER' : 'TENANT';
}

const ACCOMMODATION_SPACE_TYPES = new Set<SpaceType>([
  'PG',
  'HOSTEL',
  'CO_LIVING',
  'RENTAL',
]);

export type DisplayMembershipRole = MembershipRole | 'MEMBER';

/**
 * Label for a person in the space currently on screen.
 * OWNER, MANAGER, and STAFF stay authorization roles.
 * TENANT and CUSTOMER are service relationships: lodging shows Tenant,
 * mess shows Customer, and a profile with no service context shows Member.
 * Stored roles are not rewritten.
 */
export function contextualMembershipRole(
  role: string | null | undefined,
  spaceType?: SpaceType | null,
): DisplayMembershipRole {
  if (role === 'OWNER' || role === 'MANAGER' || role === 'STAFF') {
    return role;
  }
  if (spaceType === 'MESS') {
    return 'CUSTOMER';
  }
  if (spaceType && ACCOMMODATION_SPACE_TYPES.has(spaceType)) {
    return 'TENANT';
  }
  return 'MEMBER';
}

export function membershipRoleLabelKey(
  role: string | null | undefined,
  spaceType?: SpaceType | null,
): string {
  return `spaces.roles.${contextualMembershipRole(role, spaceType)}`;
}

export function isRoleAssignableInSpace(
  role: MembershipRole,
  spaceType: SpaceType | undefined,
): boolean {
  return assignableRolesForSpaceType(spaceType).includes(role);
}
