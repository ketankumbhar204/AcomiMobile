import type {
  MemberMealParticipationSummary,
  MemberOccupancyStatus,
  SpaceType,
} from '../api/types';

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
  if (options?.spaceType && options.spaceType !== 'MESS') {
    return isTenantMovedIn(options.occupancyStatus);
  }
  return true;
}

export function canEnableMealsForMember(options?: {
  spaceType?: SpaceType;
  occupancyStatus?: MemberOccupancyStatus | null;
}): boolean {
  if (!options?.spaceType || options.spaceType === 'MESS') {
    return true;
  }
  return isTenantMovedIn(options.occupancyStatus);
}

export function shouldCreateMealParticipationFromContract(contract?: {
  foodEnabled?: boolean;
  foodIncludedInRent?: boolean;
}): boolean {
  return Boolean(contract?.foodEnabled || contract?.foodIncludedInRent);
}
