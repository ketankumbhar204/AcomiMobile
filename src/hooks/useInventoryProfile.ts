import { useMemo } from 'react';
import type { UUID } from '../api/types';
import { useSpacePermissions } from './useSpacePermissions';
import {
  getInventoryProfile,
  type InventoryProfile,
} from '../utils/inventoryCatalog';
import {
  canManageInventory,
  canViewInventory,
} from '../utils/inventoryPermissions';

/**
 * Resolves the InventoryProfile for the active space.
 * Screens should use capability flags from `profile` instead of spaceType checks.
 */
export function useInventoryProfile(spaceId?: UUID | null) {
  const permissions = useSpacePermissions(spaceId);
  const spaceType = permissions.spaceType ?? 'PG';

  const profile: InventoryProfile = useMemo(
    () => getInventoryProfile(spaceType),
    [spaceType],
  );

  return {
    spaceId: spaceId ?? permissions.spaceId,
    spaceType,
    profile,
    permissions,
    canView: canViewInventory(permissions),
    canManage: canManageInventory(permissions),
  };
}
