import { findMySpaceEntry, resolveSpacePermissions } from '../utils/spacePermissions';
import type { MySpaceResponse } from '../api/types';

/**
 * Mirrors SpaceTabNavigator screen registration so nested tab state (if ever
 * seeded) never references Accommodation / Members when those tabs are absent.
 */
export function spaceTabRouteNamesForPermissions(input: {
  canManageMembers: boolean;
  canViewAccommodation: boolean;
}): Array<
  'Dashboard' | 'Members' | 'Accommodation' | 'Meals' | 'Payments' | 'Complaints'
> {
  const routes: Array<
    'Dashboard' | 'Members' | 'Accommodation' | 'Meals' | 'Payments' | 'Complaints'
  > = ['Dashboard'];

  if (input.canManageMembers) {
    routes.push('Members');
  }
  if (input.canViewAccommodation) {
    routes.push('Accommodation');
  }

  routes.push('Meals', 'Payments', 'Complaints');
  return routes;
}

export function spaceTabRouteNamesForSpace(
  entry: Pick<MySpaceResponse, 'membershipRole' | 'spaceType' | 'permissions'> | undefined,
) {
  const permissions = resolveSpacePermissions(entry);
  return spaceTabRouteNamesForPermissions({
    canManageMembers: permissions.canManageMembers,
    canViewAccommodation: permissions.canViewAccommodation,
  });
}

export function spaceTabRouteNamesFromStore(
  mySpaces: MySpaceResponse[],
  spaceId: string,
) {
  return spaceTabRouteNamesForSpace(findMySpaceEntry(mySpaces, spaceId));
}
