import type { DailyMenuResponse } from '../api/types';
import { MEAL_TYPES } from './mealLabels';

export type DailyMenuDaySummary = {
  published: number;
  draft: number;
  notPlanned: number;
};

export type MealOperationsEmptyKind = 'all_not_planned' | 'none_published' | 'no_responses_yet';

export function summarizeDailyMenuDay(menus: DailyMenuResponse[]): DailyMenuDaySummary {
  let published = 0;
  let draft = 0;

  for (const mealType of MEAL_TYPES) {
    const menu = menus.find(row => row.mealType === mealType);
    if (!menu) {
      continue;
    }
    if (menu.status === 'PUBLISHED') {
      published += 1;
    } else {
      draft += 1;
    }
  }

  return {
    published,
    draft,
    notPlanned: MEAL_TYPES.length - published - draft,
  };
}

export function resolveMealOperationsEmptyKind(
  summary: DailyMenuDaySummary,
): MealOperationsEmptyKind {
  if (summary.published === 0 && summary.draft === 0) {
    return 'all_not_planned';
  }
  if (summary.published === 0) {
    return 'none_published';
  }
  return 'no_responses_yet';
}
