/**
 * "How will you use ACOMI?" is a one-time entry step.
 * It closes once the authenticated account has any space membership
 * (`/spaces/my` or a default space). Zero spaces means setup has not
 * finished, including an owner create that failed.
 *
 * This reads account data only. It is not a device or browser flag.
 */
export type RoleOnboardingAccess =
  | { status: 'allowed' }
  | { status: 'space'; spaceId: string }
  | { status: 'picker' };

export function resolveRoleOnboardingAccess(
  spaceIds: readonly string[],
  selectedSpaceId?: string | null,
): RoleOnboardingAccess {
  if (selectedSpaceId && spaceIds.includes(selectedSpaceId)) {
    return { status: 'space', spaceId: selectedSpaceId };
  }

  if (spaceIds.length === 0) {
    // A resolved default space can exist before `/spaces/my` fills the list.
    // A confirmed empty account clears this id, so it is not a device flag.
    if (selectedSpaceId) {
      return { status: 'space', spaceId: selectedSpaceId };
    }
    return { status: 'allowed' };
  }

  const onlySpaceId = spaceIds[0];
  if (spaceIds.length === 1 && onlySpaceId) {
    return { status: 'space', spaceId: onlySpaceId };
  }

  return { status: 'picker' };
}
