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

export type DayShareVisual = 'not_shared' | 'shared' | 'updated' | 'failed';

/**
 * Day sharing is independent of whether a meal is saved.
 * `failed` is a client signal from a share attempt that the backend did not confirm.
 */
export function resolveDayShareVisual(
  summary: Pick<DailyMenuDaySummary, 'published' | 'modified' | 'draft'>,
  options?: { shareFailed?: boolean },
): DayShareVisual {
  if (summary.modified > 0) {
    return options?.shareFailed ? 'failed' : 'updated';
  }
  if (summary.published > 0 && summary.draft === 0) {
    return 'shared';
  }
  return options?.shareFailed ? 'failed' : 'not_shared';
}

export type DayPollControl = 'hidden' | 'open' | 'closed';

/** Open polls can be closed. Closed-only days show status. No polls hides the control. */
export function resolveDayPollControl(
  statuses: ReadonlyArray<'OPEN' | 'CLOSED'>,
): DayPollControl {
  if (statuses.length === 0) {
    return 'hidden';
  }
  if (statuses.some(status => status === 'OPEN')) {
    return 'open';
  }
  return 'closed';
}

export function isMealPlanned(
  menu?: { options?: Array<{ isAvailable?: boolean }> | null } | null,
): boolean {
  return (menu?.options?.filter(option => option.isAvailable) ?? []).length > 0;
}

export type DayShareAction = 'hidden' | 'share' | 'reshare';

/**
 * Share publishes drafts and opens polls.
 * Reshare is external sharing of a day whose planned meals are already published.
 * An edit (MODIFIED) returns to Share so the updated menu is published again.
 */
export function resolveDayShareAction(summary: DailyMenuDaySummary): DayShareAction {
  const planned = summary.published + summary.modified + summary.draft;
  if (planned <= 0) {
    return 'hidden';
  }
  if (summary.draft === 0 && summary.modified === 0 && summary.published > 0) {
    return 'reshare';
  }
  return 'share';
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
