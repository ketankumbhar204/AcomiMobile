import { mealsApi } from '../api/mealsApi';
import type { UUID } from '../api/types';
import { addDaysIsoDate, todayIsoDate } from './mealDates';

/** How far back customers may browse past menus / orders. */
export const CUSTOMER_MEAL_DATE_MIN_OFFSET = -90;
export const CUSTOMER_MEAL_DATE_MAX_OFFSET = 7;

export function customerMealDateBounds(): { minDate: string; maxDate: string } {
  const today = todayIsoDate();
  return {
    minDate: addDaysIsoDate(today, CUSTOMER_MEAL_DATE_MIN_OFFSET),
    maxDate: addDaysIsoDate(today, CUSTOMER_MEAL_DATE_MAX_OFFSET),
  };
}

export function canShiftCustomerMealDate(menuDate: string, delta: number): boolean {
  const { minDate, maxDate } = customerMealDateBounds();
  const nextDate = addDaysIsoDate(menuDate, delta);
  return nextDate >= minDate && nextDate <= maxDate;
}

/**
 * Land on today when it has polls; otherwise skip forward to the next day
 * with a planned menu within the customer date bound (+7).
 * Falls back to today when nothing is planned ahead.
 */
export async function resolveCustomerMealFocusDate(
  spaceId: UUID,
  _spaceType?: string,
): Promise<string> {
  const today = todayIsoDate();
  const { maxDate } = customerMealDateBounds();
  let cursor = today;

  while (cursor <= maxDate) {
    try {
      const day = await mealsApi.getMealPolls(spaceId, cursor);
      if ((day.polls?.length ?? 0) > 0) {
        return cursor;
      }
    } catch {
      // Keep scanning — transient/empty days should not block focus.
    }
    if (cursor === maxDate) break;
    cursor = addDaysIsoDate(cursor, 1);
  }

  return today;
}
