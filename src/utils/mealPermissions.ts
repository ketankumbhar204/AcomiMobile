import type { MembershipRole, SpacePermissionsResponse } from '../api/types';

export function deriveMealPermissions(
  role: MembershipRole | undefined,
): Pick<
  SpacePermissionsResponse,
  | 'canManageMeals'
  | 'canViewMeals'
  | 'canManageMealParticipation'
  | 'canViewOwnMealParticipation'
> {
  const isOwner = role === 'OWNER';
  const isManager = role === 'MANAGER';
  const isResident = role === 'TENANT' || role === 'CUSTOMER';

  return {
    canManageMeals: isOwner || isManager,
    canViewMeals: role != null,
    canManageMealParticipation: isOwner || isManager,
    canViewOwnMealParticipation: isOwner || isManager || isResident,
  };
}
