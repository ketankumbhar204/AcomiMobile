import { findMySpaceEntry, resolveSpacePermissions } from '../utils/spacePermissions';
import type { MySpaceResponse } from '../api/types';

/** Max primary tabs shown in the bottom bar. */
export const MAX_VISIBLE_PRIMARY_TABS = 5;

export type SpacePrimaryTabName =
  | 'Dashboard'
  | 'Members'
  | 'Accommodation'
  | 'Meals'
  | 'Payments';

export type SpaceTabRouteName = SpacePrimaryTabName | 'Complaints';

/**
 * Secondary destinations opened from the header overflow (⋮) menu.
 * Add new admin/config entries here — do not grow the primary tab list past 5.
 */
export type SpaceMoreItemId =
  | 'complaints'
  | 'menuLibrary'
  | 'mealSubscriptionPlans';

export type SpaceMoreItem = {
  id: SpaceMoreItemId;
};

/**
 * Primary bottom-tab routes for the given permissions (max 5).
 * Space-type differences (e.g. Mess has no Accommodation) flow through
 * canViewAccommodation / canManageMembers — same as SpaceTabNavigator.
 */
export function spacePrimaryTabRouteNamesForPermissions(input: {
  canManageMembers: boolean;
  canViewAccommodation: boolean;
}): SpacePrimaryTabName[] {
  const routes: SpacePrimaryTabName[] = ['Dashboard'];

  if (input.canManageMembers) {
    routes.push('Members');
  }
  if (input.canViewAccommodation) {
    routes.push('Accommodation');
  }

  routes.push('Meals', 'Payments');

  if (routes.length > MAX_VISIBLE_PRIMARY_TABS) {
    return routes.slice(0, MAX_VISIBLE_PRIMARY_TABS);
  }
  return routes;
}

/**
 * Secondary destinations for the header overflow (⋮) menu.
 * Complaints stays available to everyone who previously had the Complaints tab.
 * Library / subscription plans only when the user can manage meals.
 */
export function spaceMoreItemsForPermissions(input: {
  canManageMeals: boolean;
}): SpaceMoreItem[] {
  const items: SpaceMoreItem[] = [{ id: 'complaints' }];

  if (input.canManageMeals) {
    items.push({ id: 'menuLibrary' }, { id: 'mealSubscriptionPlans' });
  }

  return items;
}

/**
 * All tab route names registered on SpaceTabNavigator (including hidden
 * Complaints) so nested tab state never references a missing screen.
 */
export function spaceTabRouteNamesForPermissions(input: {
  canManageMembers: boolean;
  canViewAccommodation: boolean;
}): SpaceTabRouteName[] {
  return [...spacePrimaryTabRouteNamesForPermissions(input), 'Complaints'];
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

/** Main-stack routes that belong under the More secondary navigation. */
export const SPACE_MORE_STACK_ROUTE_NAMES = [
  'MenuLibrary',
  'SubscriptionPlans',
  'ComplaintDetail',
  'RaiseComplaint',
] as const;

export type SpaceMoreStackRouteName = (typeof SPACE_MORE_STACK_ROUTE_NAMES)[number];

export function isSpaceMoreStackRouteName(
  name: string | undefined,
): name is SpaceMoreStackRouteName {
  return (
    !!name &&
    (SPACE_MORE_STACK_ROUTE_NAMES as readonly string[]).includes(name)
  );
}
