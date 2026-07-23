import type { MealPollSlot, MemberMealActivityDay, MemberMealActivityMonth } from '../api/types';
import { dayHasActivity } from './memberMealActivityCalendar';

/** Count published menu entries (combos/items) across B/L/D polls for the day. */
export function countMenuItemsFromPolls(polls: MealPollSlot[]): number {
  return polls.reduce((sum, poll) => {
    const entries = poll.options.filter(option => option.optionType === 'MENU_ENTRY');
    return sum + entries.length;
  }, 0);
}

/** Per-meal item counts for Design A mini-cards. */
export function countMenuItemsByMeal(polls: MealPollSlot[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const poll of polls) {
    result[poll.mealType] = poll.options.filter(option => option.optionType === 'MENU_ENTRY').length;
  }
  return result;
}

export type CustomerRecentOrderRow = {
  date: string;
  itemCount: number;
  amount: number | null;
  currencyCode: string;
  paymentStatus: string | null;
};

function slotItemCount(day: MemberMealActivityDay): number {
  return (day.slots ?? []).reduce((sum, slot) => {
    if (slot.status !== 'ACCEPTED' && slot.status !== 'PENDING') {
      return sum;
    }
    const qty = slot.quantity != null && slot.quantity > 0 ? Number(slot.quantity) : 1;
    return sum + qty;
  }, 0);
}

/** Latest activity days with orders — from month payload already used on Meals tab. */
export function buildRecentOrdersFromActivity(
  activity: MemberMealActivityMonth | null | undefined,
  limit = 4,
): CustomerRecentOrderRow[] {
  if (!activity?.days?.length) {
    return [];
  }

  return [...activity.days]
    .filter(day => dayHasActivity(day) && slotItemCount(day) > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map(day => ({
      date: day.date,
      itemCount: slotItemCount(day),
      amount: day.dayTotal != null ? Number(day.dayTotal) : null,
      currencyCode: day.currencyCode || activity.summary?.currencyCode || 'INR',
      paymentStatus: day.paymentStatus ?? null,
    }));
}

export function countUpcomingPayments(activity: MemberMealActivityMonth | null | undefined): number {
  if (!activity?.days?.length) {
    return 0;
  }
  return activity.days.filter(day => {
    const status = day.paymentStatus;
    return (
      status === 'PENDING' ||
      status === 'PENDING_APPROVAL' ||
      status === 'REJECTED' ||
      (status as string) === 'UPDATE_REQUESTED'
    );
  }).length;
}
