import type {
  MembershipRole,
  MySpaceResponse,
  SpacePermissionsResponse,
  SpaceType,
  UUID,
} from '../api/types';
import { isAccommodationApplicable } from './accommodationProfile';
import { deriveMealPermissions } from './mealPermissions';

/** Local fallback when GET /spaces/my omits the permissions block. */
export function deriveSpacePermissions(
  role: MembershipRole | undefined,
  spaceType: SpaceType | undefined,
): SpacePermissionsResponse {
  const accommodationApplicable = spaceType ? isAccommodationApplicable(spaceType) : true;
  const isOwner = role === 'OWNER';
  const isManager = role === 'MANAGER';
  const isStaff = role === 'STAFF';

  return {
    canViewAccommodation: accommodationApplicable && (isOwner || isManager || isStaff),
    canManageAccommodation: accommodationApplicable && (isOwner || isManager),
    canDeactivateAccommodation: accommodationApplicable && isOwner,
    canManageOccupancy: isOwner || isManager,
    canViewSpaceOccupancies: isOwner || isManager || isStaff,
    canManageMembers: isOwner || isManager,
    canRemoveMember: isOwner,
    ...deriveMealPermissions(role),
    canRaiseComplaint: isOwner || isManager || role === 'TENANT' || role === 'CUSTOMER',
    canViewAllComplaints: isOwner || isManager,
    canManageComplaints: isOwner || isManager,
  };
}

export function resolveSpacePermissions(
  entry: Pick<MySpaceResponse, 'membershipRole' | 'spaceType' | 'permissions'> | undefined,
): SpacePermissionsResponse {
  if (!entry) {
    return deriveSpacePermissions(undefined, undefined);
  }
  return entry.permissions ?? deriveSpacePermissions(entry.membershipRole, entry.spaceType);
}

export function findMySpaceEntry(
  mySpaces: MySpaceResponse[],
  spaceId: UUID | null | undefined,
): MySpaceResponse | undefined {
  if (!spaceId) {
    return undefined;
  }
  return mySpaces.find(space => space.spaceId === spaceId);
}
