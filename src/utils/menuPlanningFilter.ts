import type { DailyMenuResponse, MealType } from '../api/types';
import { MEAL_TYPES } from './mealLabels';

export type MenuPlanningStatusFilter = 'published' | 'draft' | 'not_planned';

export const MENU_PLANNING_STATUSES: MenuPlanningStatusFilter[] = [
  'published',
  'draft',
  'not_planned',
];

function hasPlannedMenu(menu?: DailyMenuResponse | null): boolean {
  return (menu?.options?.filter(option => option.isAvailable) ?? []).length > 0;
}

export function slotPlanningStatus(menu?: DailyMenuResponse | null): MenuPlanningStatusFilter {
  if (!menu || !hasPlannedMenu(menu)) {
    return 'not_planned';
  }
  if (menu.status === 'PUBLISHED') {
    return 'published';
  }
  return 'draft';
}

export function filterMealTypesByPlanningStatus(
  mealTypes: readonly MealType[],
  menuMap: Partial<Record<MealType, DailyMenuResponse>>,
  selected: Set<MenuPlanningStatusFilter>,
): MealType[] {
  if (selected.size === 0 || selected.size >= MENU_PLANNING_STATUSES.length) {
    return [...mealTypes];
  }

  return mealTypes.filter(mealType => selected.has(slotPlanningStatus(menuMap[mealType])));
}

export function countMenuPlanningFilters(selected: Set<MenuPlanningStatusFilter>): number {
  if (selected.size === 0 || selected.size >= MENU_PLANNING_STATUSES.length) {
    return 0;
  }
  return 1;
}
