import { canViewOperationalDashboard } from './dashboardFinancial';

/**
 * Canonical operator check for Action Center / notifications / pending actions.
 * Prefer this over ad-hoc `canManageMeals` checks on notification surfaces.
 */
export function isSpaceOperator(permissions: {
  canManageMembers?: boolean;
  canManageMeals?: boolean;
  canManageOccupancy?: boolean;
  canViewSpaceOccupancies?: boolean;
}): boolean {
  return canViewOperationalDashboard({
    canManageMembers: permissions.canManageMembers === true,
    canManageMeals: permissions.canManageMeals === true,
    canManageOccupancy: permissions.canManageOccupancy === true,
    canViewSpaceOccupancies: permissions.canViewSpaceOccupancies === true,
  });
}

/** Alias used by notification / pending-action UI. */
export function canManageNotifications(
  permissions: Parameters<typeof isSpaceOperator>[0],
): boolean {
  return isSpaceOperator(permissions);
}
