import type { SpaceType } from '../api/types';
import { isAccommodationApplicable } from '../utils/accommodationProfile';
import { servingLocationMode } from '../utils/servingLocationPolicy';
import type { ProfileMilestone, SetupProfile } from './types';

/** Mirrors SPACE_TYPE_VALUES without importing i18n-bound spaceTypes module. */
export const LIFECYCLE_SPACE_TYPES: SpaceType[] = [
  'MESS',
  'PG',
  'HOSTEL',
  'CO_LIVING',
  'RENTAL',
];

/**
 * Build the ordered setup profile for a space type.
 * Composes existing capability gates — does not duplicate business rules.
 *
 * Phase 0 defaults (design doc):
 * - Rental: omit MEALS_READY
 * - Lodging meals: optional
 * - Mess: library → customers (optional) → today's menu → share; delivery recommended
 */
export function setupProfileForSpaceType(spaceType: SpaceType): SetupProfile {
  const milestones: ProfileMilestone[] = [
    {
      id: 'SPACE_CREATED',
      kind: 'required',
      navigationTarget: 'DASHBOARD',
    },
  ];

  if (isAccommodationApplicable(spaceType)) {
    milestones.push({
      id: 'PROPERTY_READY',
      kind: 'required',
      navigationTarget: 'QUICK_SETUP',
      requiredPermission: 'canManageAccommodation',
    });

    milestones.push({
      id: 'RESIDENTS_READY',
      kind: 'required',
      navigationTarget: 'ADD_MEMBER',
      requiredPermission: 'canManageMembers',
    });

    // Lodging: meals optional (Rental omitted — share/serving gates).
    if (spaceType === 'PG' || spaceType === 'HOSTEL' || spaceType === 'CO_LIVING') {
      milestones.push({
        id: 'MEALS_READY',
        kind: 'optional',
        navigationTarget: 'MENU_LIBRARY',
        requiredPermission: 'canManageMeals',
      });
    }
  } else {
    // Mess: customers optional (can Skip); still surfaced before planning when not dismissed.
    milestones.push({
      id: 'MEALS_READY',
      kind: 'required',
      navigationTarget: 'MENU_LIBRARY',
      requiredPermission: 'canManageMeals',
    });
    milestones.push({
      id: 'RESIDENTS_READY',
      kind: 'optional',
      navigationTarget: 'ADD_MEMBER',
      requiredPermission: 'canManageMembers',
    });
    milestones.push({
      id: 'TODAYS_MENU_READY',
      kind: 'required',
      navigationTarget: 'MENU_PLANNING',
      requiredPermission: 'canManageMeals',
    });
    milestones.push({
      id: 'MENU_SHARED',
      kind: 'required',
      navigationTarget: 'MENU_SHARE',
      requiredPermission: 'canManageMeals',
    });
  }

  if (servingLocationMode(spaceType) === 'delivery') {
    milestones.push({
      id: 'DELIVERY_READY',
      kind: 'recommended',
      navigationTarget: 'DELIVERY_LOCATIONS',
      requiredPermission: 'canManageMeals',
    });
  }

  return { spaceType, milestones };
}

/** All supported space-type profiles (regression: new types need an explicit entry). */
export function allSetupProfiles(): SetupProfile[] {
  return LIFECYCLE_SPACE_TYPES.map(setupProfileForSpaceType);
}

export function hasProfileMilestone(
  profile: SetupProfile,
  milestoneId: ProfileMilestone['id'],
): boolean {
  return profile.milestones.some(m => m.id === milestoneId);
}
