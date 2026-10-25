import type {
  MealPollStatus,
  MemberMealActivityDay,
  MemberMealActivitySlot,
  MemberMealActivitySlotStatus,
  MealPollPaymentStatus,
} from '../api/types';
import { formatComboPrice } from './comboPrice';
import { normalizeActivityDate } from './memberMealActivityCalendar';

export type ActivityHistoryFilter = 'ALL' | 'PAID' | 'PENDING' | 'SKIPPED';

export type ActivityPaymentDisplay =
  | 'PAID'
  | 'IN_REVIEW'
  | 'PENDING'
  | 'OVERDUE'
  | 'REJECTED'
  | 'NONE';

export type ActivityDateSortOrder = 'asc' | 'desc';

function normalizePollStatus(value: unknown): MealPollStatus | null {
  const raw = String(value ?? '').toUpperCase();
  if (raw === 'OPEN' || raw === 'CLOSED') {
    return raw;
  }
  return null;
}

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

/** Days worth listing: accepted / pending / skipped — not empty NO_MENU noise. */
export function dayHasListActivity(day: MemberMealActivityDay): boolean {
  const slots = day.slots ?? [];
  return slots.some(
    slot =>
      slot.status === 'ACCEPTED' ||
      slot.status === 'PENDING' ||
      slot.status === 'SKIPPED',
  );
}

export function resolveActivityPaymentDisplay(
  day: MemberMealActivityDay,
  todayIso: string,
): ActivityPaymentDisplay {
  const total = day.dayTotal != null ? Number(day.dayTotal) : 0;
  if (total <= 0) {
    return 'NONE';
  }
  const status = day.paymentStatus;
  if (status === 'PAID') {
    return 'PAID';
  }
  if (status === 'PENDING_APPROVAL') {
    return 'IN_REVIEW';
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
      return (
        display === 'PENDING' ||
        display === 'IN_REVIEW' ||
        display === 'OVERDUE' ||
        display === 'REJECTED'
      );
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
  sortOrder: ActivityDateSortOrder = 'desc',
): MemberMealActivityDay[] {
  return days
    .filter(day => dayMatchesActivityFilter(day, filter, todayIso))
    .sort((left, right) => {
      const leftDate = normalizeActivityDate(left.date) ?? left.date;
      const rightDate = normalizeActivityDate(right.date) ?? right.date;
      const cmp = leftDate.localeCompare(rightDate);
      return sortOrder === 'desc' ? -cmp : cmp;
    });
}

type ActivityPollSlot = {
  status: MemberMealActivitySlotStatus;
  pollStatus?: MealPollStatus | null;
};

/** Menu was planned, nothing was chosen, and the poll is no longer open. */
export function isUnansweredClosedPoll(slot: ActivityPollSlot): boolean {
  return slot.status === 'PENDING' && slot.pollStatus === 'CLOSED';
}

/** True when at least one published meal can still be chosen. */
export function canChooseActivityMeals(slots: ActivityPollSlot[]): boolean {
  return slots.some(slot => slot.status === 'PENDING' && slot.pollStatus !== 'CLOSED');
}

/** True when every visible meal on the day is on a closed poll. */
export function activityDayPollClosed(slots: ActivityPollSlot[]): boolean {
  const visible = slots.filter(slot => slot.status !== 'INACTIVE' && slot.status !== 'NO_MENU');
  return visible.length > 0 && visible.every(slot => slot.pollStatus === 'CLOSED');
}

export function formatSlotLine(
  slot: MemberMealActivitySlot,
  slotLabel: (status: MemberMealActivitySlotStatus) => string,
  notSelectedLabel?: string,
): { prefix: string; detail: string; amount: string | null } {
  const prefix = mealSlotPrefix(slot.mealType);
  const amount = formatComboPrice(slot.slotAmount, slot.currencyCode);
  if (isUnansweredClosedPoll(slot)) {
    return {
      prefix,
      detail: notSelectedLabel ?? slotLabel(slot.status),
      amount: null,
    };
  }
  const label = slot.selectionLabel?.trim();

  if (label && (slot.status === 'ACCEPTED' || slot.status === 'PENDING')) {
    const qtySuffix =
      slot.quantity != null && slot.quantity > 1 ? ` ×${slot.quantity}` : slot.quantity === 1 ? ' ×1' : '';
    return {
      prefix,
      detail: `${label}${qtySuffix}`,
      amount: slot.status === 'ACCEPTED' ? amount : null,
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
  const slots = Array.isArray(day.slots) ? day.slots : [];
  return {
    ...day,
    date,
    dayTotal: day.dayTotal != null ? Number(day.dayTotal) : null,
    paymentStatus: day.paymentStatus as MealPollPaymentStatus | null | undefined,
    hasActivity: dayHasListActivity({ ...day, slots }),
    slots: slots.map(slot => {
      const raw = slot as MemberMealActivitySlot & { poll_status?: string | null };
      return {
        ...slot,
        slotAmount: slot.slotAmount != null ? Number(slot.slotAmount) : null,
        pollStatus: normalizePollStatus(raw.pollStatus ?? raw.poll_status),
      };
    }),
  };
}

export function normalizeActivityMonthDays(days: MemberMealActivityDay[]): MemberMealActivityDay[] {
  return days.map(normalizeActivityMonthDay);
}
