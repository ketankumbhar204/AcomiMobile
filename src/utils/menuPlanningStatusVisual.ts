import type { DailyMenuResponse, MealPollSlot, MealType } from '../api/types';
import type { DailyMenuDaySummary } from './dailyMenuDayStatus';
import { MEAL_TYPES } from './mealLabels';
import type { MenuPlanningStatusFilter } from './menuPlanningFilter';
import { slotPlanningStatus } from './menuPlanningFilter';
import { MEAL_STATUS_THEME, MENU_PLANNING_POLL_OPEN_COLOR as POLL_OPEN } from './mealStatusTheme';

export const MENU_PLANNING_STATUS_COLORS: Record<MenuPlanningStatusFilter, string> = {
  published: MEAL_STATUS_THEME.shared.color,
  modified: MEAL_STATUS_THEME.needs_reshare.color,
  draft: MEAL_STATUS_THEME.draft.color,
  not_planned: MEAL_STATUS_THEME.empty.color,
};

export const MENU_PLANNING_STATUS_BACKGROUNDS: Record<MenuPlanningStatusFilter, string> = {
  published: MEAL_STATUS_THEME.shared.background,
  modified: MEAL_STATUS_THEME.needs_reshare.background,
  draft: MEAL_STATUS_THEME.draft.background,
  not_planned: MEAL_STATUS_THEME.empty.background,
};

/** Blue accent when a shared meal has an open poll. */
export const MENU_PLANNING_POLL_OPEN_COLOR = POLL_OPEN;

export type MealSlotCardHint = {
  status: MenuPlanningStatusFilter;
  hintKey: string;
  hintParams?: Record<string, number>;
  pollOpen?: boolean;
};

/** Compact secondary line for Breakfast / Lunch / Dinner nav cards. */
export function resolveMealSlotCardHint(
  menu?: DailyMenuResponse | null,
  poll?: Pick<MealPollSlot, 'status' | 'responseCount'> | null,
  eligibleCount = 0,
): MealSlotCardHint {
  const status = slotPlanningStatus(menu);

  if (status === 'not_planned') {
    return { status, hintKey: 'meals.planning.cardHintEmpty' };
  }
  if (status === 'draft') {
    return { status, hintKey: 'meals.planning.cardHintDraft' };
  }
  if (status === 'modified') {
    return { status, hintKey: 'meals.planning.cardHintNeedsReshare' };
  }

  const responded = poll?.responseCount ?? 0;
  const eligible = Math.max(eligibleCount, 0);

  if (poll?.status === 'OPEN') {
    return {
      status,
      hintKey: 'meals.planning.cardHintResponses',
      hintParams: { responded, eligible },
      pollOpen: true,
    };
  }

  if (poll?.status === 'CLOSED') {
    return {
      status,
      hintKey: 'meals.planning.cardHintPollClosed',
      hintParams: { responded, eligible },
    };
  }

  return { status, hintKey: 'meals.planning.cardHintShared' };
}

export const MENU_PLANNING_STATUS_SYMBOLS: Record<MenuPlanningStatusFilter, string> = {
  published: MEAL_STATUS_THEME.shared.icon,
  modified: MEAL_STATUS_THEME.needs_reshare.icon,
  draft: MEAL_STATUS_THEME.draft.icon,
  not_planned: MEAL_STATUS_THEME.empty.icon,
};

export function menuPlanningStatusLabelKey(status: MenuPlanningStatusFilter): string {
  if (status === 'published') {
    return 'meals.planning.statusShared';
  }
  if (status === 'modified') {
    return 'meals.planning.statusNeedsReshare';
  }
  if (status === 'draft') {
    return 'meals.planning.statusNotShared';
  }
  return 'meals.planning.statusEmpty';
}

export function menuPlanningStatusFilterLabelKey(status: MenuPlanningStatusFilter): string {
  if (status === 'published') {
    return 'meals.status.shared';
  }
  if (status === 'modified') {
    return 'meals.status.needsReshare';
  }
  if (status === 'draft') {
    return 'meals.status.notShared';
  }
  return 'meals.status.empty';
}

export type MealSlotOverviewDetail = {
  status: MenuPlanningStatusFilter;
  detailKey: string;
  detailParams?: Record<string, number>;
};

export function resolveMealSlotOverviewDetail(
  menu?: DailyMenuResponse | null,
  poll?: Pick<MealPollSlot, 'status' | 'responseCount'> | null,
): MealSlotOverviewDetail {
  const status = slotPlanningStatus(menu);

  if (status === 'not_planned') {
    return { status, detailKey: 'meals.planning.slotDetailEmpty' };
  }

  if (status === 'draft') {
    return { status, detailKey: 'meals.planning.slotDetailNotShared' };
  }

  if (status === 'modified') {
    return {
      status,
      detailKey: 'meals.planning.slotDetailNeedsReshare',
      detailParams: { count: poll?.responseCount ?? 0 },
    };
  }

  if (poll?.status === 'OPEN') {
    return {
      status,
      detailKey: 'meals.planning.slotDetailPollOpen',
      detailParams: { count: poll.responseCount ?? 0 },
    };
  }

  if (poll?.status === 'CLOSED') {
    return {
      status,
      detailKey: 'meals.planning.slotDetailPollClosed',
      detailParams: { count: poll.responseCount ?? 0 },
    };
  }

  return { status, detailKey: 'meals.planning.slotDetailShared' };
}

export type DayPlanningHint = {
  key: string;
  params?: Record<string, number>;
  tone: 'neutral' | 'action' | 'success';
};

export function resolveDayPlanningHint(summary: DailyMenuDaySummary): DayPlanningHint {
  const { published, modified, draft, notPlanned } = summary;

  if (published === 0 && modified === 0 && draft === 0) {
    return {
      key: 'meals.planning.dayHintStart',
      tone: 'action',
    };
  }

  if (modified > 0) {
    return {
      key: 'meals.planning.dayHintNeedsReshare',
      params: { count: modified },
      tone: 'action',
    };
  }

  if (draft === 0 && notPlanned === 0) {
    return {
      key: 'meals.planning.dayHintAllShared',
      tone: 'success',
    };
  }

  if (published === 0 && draft > 0) {
    return {
      key: 'meals.planning.dayHintShareAll',
      params: { count: draft },
      tone: 'action',
    };
  }

  if (draft > 0) {
    return {
      key: 'meals.planning.dayHintShareSome',
      params: { shared: published, notShared: draft },
      tone: 'action',
    };
  }

  return {
    key: 'meals.planning.dayHintPartial',
    params: { shared: published, empty: notPlanned },
    tone: 'neutral',
  };
}

export function countMealsByPlanningStatus(
  menuMap: Partial<Record<MealType, DailyMenuResponse>>,
): Record<MenuPlanningStatusFilter, number> {
  const counts: Record<MenuPlanningStatusFilter, number> = {
    published: 0,
    modified: 0,
    draft: 0,
    not_planned: 0,
  };

  for (const mealType of MEAL_TYPES) {
    const status = slotPlanningStatus(menuMap[mealType]);
    counts[status] += 1;
  }

  return counts;
}
