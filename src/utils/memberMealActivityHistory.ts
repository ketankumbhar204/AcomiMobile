import type {
  MemberMealActivityDay,
  MemberMealActivitySlot,
  MemberMealActivitySlotStatus,
  MealPollPaymentStatus,
} from '../api/types';
import { formatComboPrice } from './comboPrice';
import { normalizeActivityDate } from './memberMealActivityCalendar';

export type ActivityHistoryFilter = 'ALL' | 'PAID' | 'PENDING' | 'SKIPPED';

export type ActivityPaymentDisplay = 'PAID' | 'PENDING' | 'OVERDUE' | 'REJECTED' | 'NONE';

const MEAL_PREFIX: Record<string, string> = {
  BREAKFAST: 'B',
  LUNCH: 'L',
  DINNER: 'D',
};

export function formatActivityListDate(isoDate: string, locale: string): string {
  const normalized = normalizeActivityDate(isoDate) ?? isoDate;
  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.toLocaleDateString(locale, { weekday: 'short' });
  const monthDay = date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return `${monthDay} (${weekday})`;
}

export function mealSlotPrefix(mealType: string): string {
  return MEAL_PREFIX[mealType] ?? mealType.slice(0, 1);
}

export function dayHasListActivity(day: MemberMealActivityDay): boolean {
  if (day.hasActivity) {
    return true;
  }
  return day.slots.some(slot => slot.status !== 'INACTIVE');
}

export function resolveActivityPaymentDisplay(
  day: MemberMealActivityDay,
  todayIso: string,
): ActivityPaymentDisplay {
  const total = day.dayTotal ?? 0;
  if (total <= 0) {
    return 'NONE';
  }
  const status = day.paymentStatus;
  if (status === 'PAID') {
    return 'PAID';
  }
  if (status === 'REJECTED') {
    return 'REJECTED';
  }
  const dateKey = normalizeActivityDate(day.date) ?? day.date;
  if (dateKey < todayIso) {
    return 'OVERDUE';
  }
  return 'PENDING';
}

export function dayMatchesActivityFilter(
  day: MemberMealActivityDay,
  filter: ActivityHistoryFilter,
  todayIso: string,
): boolean {
  if (!dayHasListActivity(day)) {
    return false;
  }
  switch (filter) {
    case 'ALL':
      return true;
    case 'PAID':
      return resolveActivityPaymentDisplay(day, todayIso) === 'PAID';
    case 'PENDING': {
      const display = resolveActivityPaymentDisplay(day, todayIso);
      return display === 'PENDING' || display === 'OVERDUE' || display === 'REJECTED';
    }
    case 'SKIPPED':
      return day.slots.some(slot => slot.status === 'SKIPPED');
    default:
      return true;
  }
}

export function filterActivityDays(
  days: MemberMealActivityDay[],
  filter: ActivityHistoryFilter,
  todayIso: string,
): MemberMealActivityDay[] {
  return days
    .filter(day => dayMatchesActivityFilter(day, filter, todayIso))
    .sort((left, right) => {
      const leftDate = normalizeActivityDate(left.date) ?? left.date;
      const rightDate = normalizeActivityDate(right.date) ?? right.date;
      return leftDate.localeCompare(rightDate);
    });
}

export function formatSlotLine(
  slot: MemberMealActivitySlot,
  slotLabel: (status: MemberMealActivitySlotStatus) => string,
): { prefix: string; detail: string; amount: string | null } {
  const prefix = mealSlotPrefix(slot.mealType);
  const amount = formatComboPrice(slot.slotAmount, slot.currencyCode);

  if (slot.status === 'ACCEPTED' && slot.selectionLabel) {
    const qtySuffix =
      slot.quantity != null && slot.quantity > 1 ? ` ×${slot.quantity}` : slot.quantity === 1 ? ' ×1' : '';
    return {
      prefix,
      detail: `${slot.selectionLabel}${qtySuffix}`,
      amount,
    };
  }

  return {
    prefix,
    detail: slotLabel(slot.status),
    amount: slot.status === 'ACCEPTED' ? amount : null,
  };
}

export function formatPaymentLine(
  day: MemberMealActivityDay,
  todayIso: string,
  labels: Record<ActivityPaymentDisplay, string>,
): { display: ActivityPaymentDisplay; label: string; amount: string | null } {
  const display = resolveActivityPaymentDisplay(day, todayIso);
  const amount = formatComboPrice(day.dayTotal, day.currencyCode);
  return {
    display,
    label: labels[display],
    amount,
  };
}

export function normalizeActivityMonthDay(day: MemberMealActivityDay): MemberMealActivityDay {
  const date = normalizeActivityDate(day.date) ?? day.date;
  return {
    ...day,
    date,
    dayTotal: day.dayTotal != null ? Number(day.dayTotal) : null,
    paymentStatus: day.paymentStatus as MealPollPaymentStatus | null | undefined,
    slots: day.slots.map(slot => ({
      ...slot,
      slotAmount: slot.slotAmount != null ? Number(slot.slotAmount) : null,
    })),
  };
}

export function normalizeActivityMonthDays(days: MemberMealActivityDay[]): MemberMealActivityDay[] {
  return days.map(normalizeActivityMonthDay);
}
