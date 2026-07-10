import { mealsApi } from '../api/mealsApi';
import type { MealPollDayResponse, MealPollSlot, SpaceType, UUID } from '../api/types';
import { addDaysIsoDate, todayIsoDate } from './mealDates';

const SCAN_PAST_DAYS = 1;
const SCAN_FUTURE_DAYS = 3;

export const CUSTOMER_MEAL_DATE_MIN_OFFSET = -SCAN_PAST_DAYS;
export const CUSTOMER_MEAL_DATE_MAX_OFFSET = 7;

function pollHasResponse(poll: MealPollSlot, multiQuantity: boolean): boolean {
  if (multiQuantity) {
    return poll.mySelections?.some(selection => selection.quantity > 0) ?? false;
  }
  return poll.mySelectedOptionId != null;
}

function dayNeedsAction(day: MealPollDayResponse, multiQuantity: boolean): boolean {
  const openPolls = day.polls.filter(poll => poll.status === 'OPEN');
  if (openPolls.length === 0) {
    return false;
  }
  return openPolls.some(poll => !pollHasResponse(poll, multiQuantity));
}

function dayHasOpenPolls(day: MealPollDayResponse): boolean {
  return day.polls.some(poll => poll.status === 'OPEN');
}

function buildScanDates(): string[] {
  const today = todayIsoDate();
  const dates: string[] = [];
  for (let offset = -SCAN_PAST_DAYS; offset <= SCAN_FUTURE_DAYS; offset += 1) {
    dates.push(addDaysIsoDate(today, offset));
  }
  return dates;
}

function latestPublishedMenuDate(menus: Array<{ menuDate: string; publishedAt?: string | null }>): string | null {
  const publishedDates = new Map<string, string>();
  for (const menu of menus) {
    if (!menu.publishedAt) {
      continue;
    }
    const existing = publishedDates.get(menu.menuDate);
    if (!existing || menu.publishedAt > existing) {
      publishedDates.set(menu.menuDate, menu.publishedAt);
    }
  }
  const sorted = [...publishedDates.entries()].sort((a, b) => b[1].localeCompare(a[1]));
  return sorted[0]?.[0] ?? null;
}

export async function resolveCustomerMealFocusDate(
  spaceId: UUID,
  spaceType?: SpaceType,
): Promise<string> {
  const today = todayIsoDate();
  const multiQuantity = spaceType === 'MESS';
  const dates = buildScanDates();

  const dayEntries = await Promise.all(
    dates.map(async date => {
      try {
        const day = await mealsApi.getMealPolls(spaceId, date);
        return { date, day };
      } catch {
        return { date, day: null };
      }
    }),
  );

  const needingAction = dayEntries
    .filter(entry => entry.day && dayNeedsAction(entry.day, multiQuantity))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (needingAction.length > 0) {
    return needingAction[0].date;
  }

  try {
    const from = addDaysIsoDate(today, -SCAN_PAST_DAYS);
    const to = addDaysIsoDate(today, SCAN_FUTURE_DAYS);
    const menus = await mealsApi.getDailyMenusRange(spaceId, from, to);
    const latestPublishedDate = latestPublishedMenuDate(menus);
    if (latestPublishedDate) {
      const publishedDay = dayEntries.find(entry => entry.date === latestPublishedDate)?.day;
      if (publishedDay && dayHasOpenPolls(publishedDay)) {
        return latestPublishedDate;
      }
      if (publishedDay) {
        return latestPublishedDate;
      }
    }
  } catch {
    // Fall through to poll-based defaults.
  }

  const todayEntry = dayEntries.find(entry => entry.date === today);
  if (todayEntry?.day && dayHasOpenPolls(todayEntry.day)) {
    return today;
  }

  const tomorrow = addDaysIsoDate(today, 1);
  const tomorrowEntry = dayEntries.find(entry => entry.date === tomorrow);
  if (tomorrowEntry?.day && dayHasOpenPolls(tomorrowEntry.day)) {
    return tomorrow;
  }

  const firstOpen = dayEntries
    .filter(entry => entry.day && dayHasOpenPolls(entry.day))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (firstOpen) {
    return firstOpen.date;
  }

  return today;
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
