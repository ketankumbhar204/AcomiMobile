import type { MembershipRole } from '../api/types';

/**
 * Creating a space makes the caller its owner.
 * Someone who already owns a space may create another.
 * Someone with no membership yet may create their first space.
 * Tenant, customer, member, staff, and manager memberships do not grant this.
 */
export function canCreateSpace(
  memberships: ReadonlyArray<{ membershipRole?: MembershipRole | string | null }>,
): boolean {
  if (memberships.length === 0) {
    return true;
  }
  return memberships.some(membership => membership.membershipRole === 'OWNER');
}
