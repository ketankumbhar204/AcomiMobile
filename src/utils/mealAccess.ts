import type {
  MemberMealParticipationSummary,
  MemberOccupancyStatus,
  MemberStatus,
  SpaceType,
} from '../api/types';

/** Matches backend MealAccessService: rental spaces do not run meal participation. */
export function mealsApplicableForSpace(spaceType?: SpaceType | null): boolean {
  return spaceType != null && spaceType !== 'RENTAL';
}

export function isReceivingMeals(
  participation?: MemberMealParticipationSummary | null,
): boolean {
  return participation?.status === 'ACTIVE';
}

export function isTenantMovedIn(
  occupancyStatus?: MemberOccupancyStatus | null,
): boolean {
  return occupancyStatus === 'ALLOCATED';
}

/** Reserved or moved-in — food can be managed for these stays. */
export function isTenantOnActiveStay(
  occupancyStatus?: MemberOccupancyStatus | null,
): boolean {
  return occupancyStatus === 'ALLOCATED' || occupancyStatus === 'RESERVED';
}

function isMemberStatusEligibleForMeals(
  memberStatus?: MemberStatus | string | null,
): boolean {
  const status = memberStatus ?? 'ACTIVE';
  return status === 'ACTIVE';
}

export function isReceivingMealsForMember(
  participation?: MemberMealParticipationSummary | null,
  options?: {
    spaceType?: SpaceType;
    occupancyStatus?: MemberOccupancyStatus | null;
  },
): boolean {
  if (!isReceivingMeals(participation)) {
    return false;
  }
  if (options?.spaceType === 'MESS') {
    return true;
  }
  if (options?.spaceType) {
    // Reflect food-included state for reserved and moved-in tenants.
    return isTenantOnActiveStay(options.occupancyStatus);
  }
  return true;
}

export function canEnableMealsForMember(options?: {
  spaceType?: SpaceType;
  occupancyStatus?: MemberOccupancyStatus | null;
  memberStatus?: MemberStatus | string | null;
}): boolean {
  if (!isMemberStatusEligibleForMeals(options?.memberStatus)) {
    return false;
  }
  if (!options?.spaceType || options.spaceType === 'MESS') {
    return true;
  }
  return isTenantOnActiveStay(options.occupancyStatus);
}

/**
 * Food / meal toggle on member list cards.
 * Visible for reserved + moved-in tenants (and mess customers).
 * Hidden for vacated occupancy and vacated / blacklisted / suspended / inactive members.
 */
export function shouldShowMealAccessForMember(options?: {
  spaceType?: SpaceType;
  occupancyStatus?: MemberOccupancyStatus | null;
  memberStatus?: MemberStatus | string | null;
}): boolean {
  return canEnableMealsForMember(options);
}

export function getMemberListFoodLabel(
  receiving: boolean,
  spaceType: SpaceType | undefined,
  t: (key: string) => string,
): string {
  if (spaceType === 'MESS') {
    return receiving
      ? t('meals.accessStatus.receiving')
      : t('meals.accessStatus.notReceiving');
  }
  return receiving
    ? t('meals.foodIncluded.label')
    : t('meals.foodIncluded.notIncluded');
}

export function shouldCreateMealParticipationFromContract(contract?: {
  foodEnabled?: boolean;
  foodIncludedInRent?: boolean;
}): boolean {
  return Boolean(contract?.foodEnabled || contract?.foodIncludedInRent);
}
