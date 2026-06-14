import type { MealParticipationStatus, MealPlanCode } from '../../api/types';

export function mealPlanLabelKey(code: MealPlanCode): string {
  return `meals.plan.${code.toLowerCase()}`;
}

export function mealParticipationStatusLabelKey(status: MealParticipationStatus): string {
  return `meals.status.${status.toLowerCase()}`;
}

export function mealTypeLabelKey(mealType: string): string {
  return `meals.mealType.${mealType.toLowerCase()}`;
}

export const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER'] as const;

export const MEAL_PLAN_CODES = [
  'FULL',
  'BREAKFAST',
  'LUNCH',
  'DINNER',
  'CUSTOM',
] as const;
