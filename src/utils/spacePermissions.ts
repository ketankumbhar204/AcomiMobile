import type {
  MembershipRole,
  MySpaceResponse,
  SpacePermissionsResponse,
  SpaceType,
  UUID,
} from '../api/types';
import { isAccommodationApplicable } from './accommodationProfile';
import { deriveInventoryPermissions } from './inventoryPermissions';
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
    ...deriveInventoryPermissions(role),
  };
}

export function resolveSpacePermissions(
  entry: Pick<MySpaceResponse, 'membershipRole' | 'spaceType' | 'permissions'> | undefined,
): SpacePermissionsResponse {
  if (!entry) {
    return deriveSpacePermissions(undefined, undefined);
  }
  const derived = deriveSpacePermissions(entry.membershipRole, entry.spaceType);
  if (!entry.permissions) {
    return derived;
  }
  // Merge server permissions over local defaults. New client flags (e.g. inventory)
  // must survive when the API omits them until the backend ships those fields.
  return {
    ...derived,
    ...entry.permissions,
    canViewInventory: entry.permissions.canViewInventory ?? derived.canViewInventory,
    canManageInventory: entry.permissions.canManageInventory ?? derived.canManageInventory,
  };
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
