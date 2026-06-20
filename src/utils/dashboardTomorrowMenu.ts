import type {
  DailyMenuResponse,
  MealEligibilitySummaryResponse,
  MealPollSlot,
  MealType,
} from '../api/types';
import { MEAL_TYPES } from './mealLabels';
import { hasAvailableMenuOptions } from './shareMenuSelection';

export type DashboardAttentionKind =
  | 'not_planned'
  | 'partial_planned'
  | 'ready_to_share'
  | 'poll_open';

export type DashboardAttention = {
  kind: DashboardAttentionKind;
  scheduledCount: number;
  totalMeals: number;
  missingMealTypes: MealType[];
  respondedCount: number;
  eligibleCount: number;
  openPollCount: number;
};

function isMealPlanned(menus: DailyMenuResponse[], mealType: MealType): boolean {
  const menu = menus.find(row => row.mealType === mealType);
  return hasAvailableMenuOptions(menu);
}

function isMealPublished(
  eligibility: MealEligibilitySummaryResponse | null,
  mealType: MealType,
): boolean {
  return eligibility?.slots.find(slot => slot.mealType === mealType)?.published === true;
}

export function resolveDashboardAttention(
  menus: DailyMenuResponse[],
  eligibility: MealEligibilitySummaryResponse | null,
  polls: MealPollSlot[],
): DashboardAttention | null {
  const plannedTypes = MEAL_TYPES.filter(mealType => isMealPlanned(menus, mealType));
  const missingMealTypes = MEAL_TYPES.filter(mealType => !plannedTypes.includes(mealType));
  const publishedTypes = MEAL_TYPES.filter(mealType => isMealPublished(eligibility, mealType));
  const openPolls = polls.filter(poll => poll.status === 'OPEN');
  const eligibleCount =
    eligibility?.distinctEligibleMemberCount ??
    eligibility?.slots.reduce((max, slot) => Math.max(max, slot.eligibleCount), 0) ??
    0;
  const respondedCount =
    openPolls.length > 0 ? Math.max(...openPolls.map(poll => poll.responseCount)) : 0;

  const base = {
    scheduledCount: plannedTypes.length,
    totalMeals: MEAL_TYPES.length,
    missingMealTypes,
    respondedCount,
    eligibleCount,
    openPollCount: openPolls.length,
  };

  if (plannedTypes.length === 0) {
    return { kind: 'not_planned', ...base };
  }

  if (missingMealTypes.length > 0) {
    return { kind: 'partial_planned', ...base };
  }

  if (publishedTypes.length < MEAL_TYPES.length) {
    return { kind: 'ready_to_share', ...base };
  }

  if (openPolls.length > 0 && eligibleCount > 0 && respondedCount < eligibleCount) {
    return { kind: 'poll_open', ...base };
  }

  return null;
}
