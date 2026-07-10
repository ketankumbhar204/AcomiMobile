import type { DailyMenuResponse, MealPollSlot, MealType } from '../api/types';
import { MEAL_TYPES } from './mealLabels';
import type { MenuPlanningStatusFilter } from './menuPlanningFilter';
import { slotPlanningStatus } from './menuPlanningFilter';

export type DashboardMealSlotRow = {
  mealType: MealType;
  status: MenuPlanningStatusFilter;
  statusLabelKey: string;
  captionKey: string;
  captionParams?: Record<string, number>;
};

export function resolveDashboardMealSlotStatusLabelKey(
  status: MenuPlanningStatusFilter,
): string {
  if (status === 'published') {
    return 'dashboard.operations.statusPublished';
  }
  if (status === 'draft') {
    return 'dashboard.operations.statusDraft';
  }
  return 'dashboard.operations.statusNotPlanned';
}

export function resolveDashboardMealSlotCaption(
  status: MenuPlanningStatusFilter,
  poll?: MealPollSlot | null,
): Pick<DashboardMealSlotRow, 'captionKey' | 'captionParams'> {
  if (status === 'not_planned') {
    return { captionKey: 'dashboard.operations.ctaPlanMenu' };
  }
  if (status === 'draft') {
    return { captionKey: 'dashboard.operations.ctaPublishShare' };
  }

  const count = poll?.responseCount ?? 0;
  if (poll?.status === 'CLOSED') {
    return {
      captionKey: 'dashboard.operations.pollClosedResponses',
      captionParams: { count },
    };
  }
  if (count > 0) {
    return {
      captionKey: 'dashboard.operations.responsesCount',
      captionParams: { count },
    };
  }
  return { captionKey: 'dashboard.operations.ctaResponsesCollecting' };
}

export function buildDashboardMealSlotRows(
  menuMap: Partial<Record<MealType, DailyMenuResponse>>,
  pollMap: Partial<Record<MealType, MealPollSlot>>,
): DashboardMealSlotRow[] {
  return MEAL_TYPES.map(mealType => {
    const status = slotPlanningStatus(menuMap[mealType]);
    const caption = resolveDashboardMealSlotCaption(status, pollMap[mealType]);
    return {
      mealType,
      status,
      statusLabelKey: resolveDashboardMealSlotStatusLabelKey(status),
      ...caption,
    };
  });
}
