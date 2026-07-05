import type { DailyMenuResponse, MealPollSlot, MealType } from '../api/types';
import { colors } from '../theme';
import type { DailyMenuDaySummary } from './dailyMenuDayStatus';
import { MEAL_TYPES } from './mealLabels';
import type { MenuPlanningStatusFilter } from './menuPlanningFilter';
import { slotPlanningStatus } from './menuPlanningFilter';

export const MENU_PLANNING_STATUS_COLORS: Record<MenuPlanningStatusFilter, string> = {
  published: colors.success,
  draft: '#D97706',
  not_planned: colors.muted,
};

export const MENU_PLANNING_STATUS_BACKGROUNDS: Record<MenuPlanningStatusFilter, string> = {
  published: colors.lightGreen,
  draft: '#FFF7ED',
  not_planned: colors.surface,
};

export const MENU_PLANNING_STATUS_SYMBOLS: Record<MenuPlanningStatusFilter, string> = {
  published: '✓',
  draft: '●',
  not_planned: '○',
};

export function menuPlanningStatusLabelKey(status: MenuPlanningStatusFilter): string {
  if (status === 'published') {
    return 'meals.planning.statusShared';
  }
  if (status === 'draft') {
    return 'meals.planning.statusNotShared';
  }
  return 'meals.planning.statusEmpty';
}

export function menuPlanningStatusFilterLabelKey(status: MenuPlanningStatusFilter): string {
  if (status === 'published') {
    return 'meals.planning.filterShared';
  }
  if (status === 'draft') {
    return 'meals.planning.filterNotShared';
  }
  return 'meals.planning.filterEmpty';
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
  const { published, draft, notPlanned } = summary;

  if (published === 0 && draft === 0) {
    return {
      key: 'meals.planning.dayHintStart',
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
    draft: 0,
    not_planned: 0,
  };

  for (const mealType of MEAL_TYPES) {
    const status = slotPlanningStatus(menuMap[mealType]);
    counts[status] += 1;
  }

  return counts;
}
