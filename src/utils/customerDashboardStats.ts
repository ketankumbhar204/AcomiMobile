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

function isUnpaidMealDay(status: string | null | undefined): boolean {
  return (
    status === 'PENDING' ||
    status === 'PENDING_APPROVAL' ||
    status === 'REJECTED' ||
    status === 'UPDATE_REQUESTED'
  );
}

/**
 * Unpaid meal days. When `todayIso` is set, only days after today count —
 * overdue and due-today obligations stay out of "upcoming".
 */
export function countUpcomingPayments(
  activity: MemberMealActivityMonth | null | undefined,
  todayIso?: string,
): number {
  if (!activity?.days?.length) {
    return 0;
  }
  return activity.days.filter(day => {
    if (!isUnpaidMealDay(day.paymentStatus)) {
      return false;
    }
    if (todayIso && day.date <= todayIso) {
      return false;
    }
    return true;
  }).length;
}

/** Unpaid meal days the member still needs to settle, including overdue. */
export function countOpenMealPayments(
  activity: MemberMealActivityMonth | null | undefined,
): number {
  if (!activity?.days?.length) {
    return 0;
  }
  return activity.days.filter(day => isUnpaidMealDay(day.paymentStatus)).length;
}

export type MemberDashboardLedgerPayment = {
  paymentStatus: string;
  amount?: number | null;
  outstandingAmount?: number | null;
  dueDate?: string | null;
  isOverdue?: boolean | null;
};

export type MemberDashboardLedgerStats = {
  /** Remaining payable. `0` when the month loaded and nothing is owed. `null` when amounts are unknown. */
  dueAmount: number | null;
  /** Unpaid obligations dated after today. Overdue rows are not included. */
  upcomingCount: number;
  /** Pending, rejected, or needs-update charges, including overdue. */
  openPaymentCount: number;
};

const ACTION_NEEDED = new Set(['PENDING', 'REJECTED', 'UPDATE_REQUESTED']);
const STILL_OWED = new Set(['PENDING', 'REJECTED', 'UPDATE_REQUESTED', 'UNDER_REVIEW', 'PROOF_UPLOADED']);

function asMoney(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(Number(value))) {
    return null;
  }
  return Number(value);
}

/** Remaining balance for one charge. Uses outstanding when present, otherwise the listed amount. */
export function remainingPayable(payment: MemberDashboardLedgerPayment): number | null {
  if (payment.paymentStatus === 'PAID') {
    const outstanding = asMoney(payment.outstandingAmount);
    return outstanding != null && outstanding > 0.009 ? outstanding : 0;
  }
  const outstanding = asMoney(payment.outstandingAmount);
  if (outstanding != null) {
    return outstanding;
  }
  if (STILL_OWED.has(payment.paymentStatus)) {
    return asMoney(payment.amount);
  }
  return null;
}

/**
 * Member dashboard figures from the same charge rows My Payments lists.
 * Fully paid rows add nothing. A partial payment adds only what is still outstanding.
 */
export function summarizeMemberDashboardLedger(
  payments: MemberDashboardLedgerPayment[],
  todayIso: string,
): MemberDashboardLedgerStats {
  if (payments.length === 0) {
    return { dueAmount: 0, upcomingCount: 0, openPaymentCount: 0 };
  }

  let due = 0;
  let sawDue = false;
  let upcomingCount = 0;
  let openPaymentCount = 0;

  for (const payment of payments) {
    const remaining = remainingPayable(payment);
    if (remaining != null) {
      sawDue = true;
      if (remaining > 0.009 && payment.paymentStatus !== 'PAID') {
        due += remaining;
      }
    }

    const actionable =
      ACTION_NEEDED.has(payment.paymentStatus) && (remaining == null || remaining > 0.009);
    if (!actionable) {
      continue;
    }
    openPaymentCount += 1;
    const overdue =
      payment.isOverdue === true || (payment.dueDate != null && payment.dueDate < todayIso);
    if (!overdue && payment.dueDate != null && payment.dueDate > todayIso) {
      upcomingCount += 1;
    }
  }

  return {
    dueAmount: sawDue ? due : null,
    upcomingCount,
    openPaymentCount,
  };
}
