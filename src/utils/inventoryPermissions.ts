import type { MembershipRole, SpacePermissionsResponse } from '../api/types';

/** Inventory is for operators — tenants/customers do not manage stock. */
export function deriveInventoryPermissions(
  role: MembershipRole | undefined,
): Pick<SpacePermissionsResponse, 'canViewInventory' | 'canManageInventory'> {
  const isOwner = role === 'OWNER';
  const isManager = role === 'MANAGER';
  const isStaff = role === 'STAFF';
  return {
    canViewInventory: isOwner || isManager || isStaff,
    canManageInventory: isOwner || isManager,
  };
}

export function canViewInventory(permissions: SpacePermissionsResponse): boolean {
  return permissions.canViewInventory === true;
}

export function canManageInventory(permissions: SpacePermissionsResponse): boolean {
  return permissions.canManageInventory === true;
}
