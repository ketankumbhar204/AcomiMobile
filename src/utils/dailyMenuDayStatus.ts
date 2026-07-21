import type { DailyMenuResponse, MealType } from '../api/types';
import { MEAL_TYPES } from './mealLabels';

function hasPlannedMenu(menu: DailyMenuResponse): boolean {
  return (menu.options?.filter(option => option.isAvailable) ?? []).length > 0;
}

export type DailyMenuDaySummary = {
  published: number;
  modified: number;
  draft: number;
  notPlanned: number;
};

export type MealOperationsEmptyKind = 'all_not_planned' | 'none_published' | 'no_responses_yet';

export function listPlannedMealTypes(menus: DailyMenuResponse[]): MealType[] {
  return MEAL_TYPES.filter(mealType => {
    const menu = menus.find(row => row.mealType === mealType);
    return menu != null && hasPlannedMenu(menu);
  });
}

export function summarizeDailyMenuDay(menus: DailyMenuResponse[]): DailyMenuDaySummary {
  let published = 0;
  let modified = 0;
  let draft = 0;

  for (const mealType of MEAL_TYPES) {
    const menu = menus.find(row => row.mealType === mealType);
    if (!menu || !hasPlannedMenu(menu)) {
      continue;
    }
    if (menu.status === 'PUBLISHED') {
      published += 1;
    } else if (menu.status === 'MODIFIED') {
      modified += 1;
    } else {
      draft += 1;
    }
  }

  return {
    published,
    modified,
    draft,
    notPlanned: MEAL_TYPES.length - published - modified - draft,
  };
}

export function resolveMealOperationsEmptyKind(
  summary: DailyMenuDaySummary,
): MealOperationsEmptyKind {
  if (summary.published === 0 && summary.modified === 0 && summary.draft === 0) {
    return 'all_not_planned';
  }
  if (summary.published === 0 && summary.modified === 0) {
    return 'none_published';
  }
  return 'no_responses_yet';
}
