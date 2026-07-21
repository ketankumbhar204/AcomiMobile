import { addDaysIsoDate, todayIsoDate } from './mealDates';

/** How far back customers may browse past menus / orders. */
export const CUSTOMER_MEAL_DATE_MIN_OFFSET = -90;
export const CUSTOMER_MEAL_DATE_MAX_OFFSET = 7;

/**
 * Customers always land on today when opening the dashboard.
 * Past/future days remain reachable via the date arrows.
 */
export async function resolveCustomerMealFocusDate(
  _spaceId?: string,
  _spaceType?: string,
): Promise<string> {
  return todayIsoDate();
}

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
