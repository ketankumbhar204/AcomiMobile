import type {
  MealPollPaymentStatus,
  MealType,
  MemberMealActivityDay,
  MemberMealActivityMonth,
} from '../api/types';
import { MEAL_TYPES } from './mealLabels';
import { todayIsoDate } from './mealDates';

export type DayMealPaymentDisplayStatus =
  | 'PENDING'
  | 'OVERDUE'
  | 'PENDING_APPROVAL'
  | 'PAID'
  | 'REJECTED';

export type DayMealPaymentListItem = {
  date: string;
  /** Outstanding currency for the day. Null when meal prices are not configured. */
  amount: number | null;
  amountKnown: boolean;
  currencyCode: string;
  paymentStatus: MealPollPaymentStatus | null;
  displayStatus: DayMealPaymentDisplayStatus;
  mealTypes: MealType[];
  paymentBatchId?: string | null;
  paymentReference?: string | null;
  paymentId?: string | null;
};

export type DayMealPaymentsSection = 'actionNeeded' | 'underReview' | 'history';

export type DayMealPaymentMonthSummary = {
  month: string;
  pendingAmount: number | null;
  collectedAmount: number | null;
  totalAmount: number | null;
  pendingCount: number;
  currencyCode: string;
};

function positiveAmount(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(Number(value))) {
    return null;
  }
  const amount = Number(value);
  return amount > 0 ? amount : null;
}

/** Payable amount for one activity day. A missing meal price stays unknown instead of becoming zero. */
export function resolveDayMealPayableAmount(day: MemberMealActivityDay): {
  amount: number | null;
  amountKnown: boolean;
} {
  if (day.amountKnown === false) {
    return { amount: null, amountKnown: false };
  }
  const live = positiveAmount(day.dayTotal);
  if (live != null) {
    return { amount: live, amountKnown: true };
  }
  const accepted = day.slots.filter(slot => slot.status === 'ACCEPTED');
  if (accepted.length === 0) {
    return { amount: 0, amountKnown: true };
  }
  const missingSlotPrice = accepted.some(slot => positiveAmount(slot.slotAmount) == null);
  if (!missingSlotPrice) {
    const slotSum = accepted.reduce((sum, slot) => sum + (positiveAmount(slot.slotAmount) ?? 0), 0);
    return { amount: slotSum, amountKnown: true };
  }
  return { amount: null, amountKnown: false };
}

function sumKnownAmounts(items: DayMealPaymentListItem[]): number | null {
  if (items.some(item => !item.amountKnown || item.amount == null)) {
    return null;
  }
  return items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
}

function acceptedMealTypes(day: MemberMealActivityDay): MealType[] {
  return MEAL_TYPES.filter(mealType =>
    day.slots.some(slot => slot.mealType === mealType && slot.status === 'ACCEPTED'),
  );
}

export function resolveDayMealPaymentDisplayStatus(
  paymentStatus: MealPollPaymentStatus | null | undefined,
  date: string,
  todayIso: string = todayIsoDate(),
): DayMealPaymentDisplayStatus {
  if (paymentStatus === 'PAID') {
    return 'PAID';
  }
  if (paymentStatus === 'PENDING_APPROVAL') {
    return 'PENDING_APPROVAL';
  }
  if (paymentStatus === 'REJECTED') {
    return 'REJECTED';
  }
  if (date < todayIso) {
    return 'OVERDUE';
  }
  return 'PENDING';
}

export function buildDayMealPaymentListItems(
  activity: MemberMealActivityMonth | null | undefined,
  todayIso: string = todayIsoDate(),
): DayMealPaymentListItem[] {
  if (!activity?.days?.length) {
    return [];
  }

  return activity.days
    .map(day => {
      const payable = resolveDayMealPayableAmount(day);
      const amount = payable.amount;
      const mealTypes = acceptedMealTypes(day);
      const hasCharge = (amount != null && amount > 0) || mealTypes.length > 0 || !payable.amountKnown;
      if (!hasCharge && day.paymentStatus == null) {
        return null;
      }
      if (!hasCharge && day.paymentStatus === 'PAID') {
        // Keep paid zero rows out of list noise
        return null;
      }
      if ((amount == null || amount <= 0) && mealTypes.length === 0 && payable.amountKnown) {
        return null;
      }

      const paymentStatus = day.paymentStatus ?? null;
      return {
        date: day.date,
        amount: payable.amountKnown ? amount : null,
        amountKnown: payable.amountKnown,
        currencyCode: day.currencyCode ?? activity.summary.currencyCode ?? 'INR',
        paymentStatus,
        displayStatus: resolveDayMealPaymentDisplayStatus(paymentStatus, day.date, todayIso),
        mealTypes,
        paymentBatchId: day.paymentBatchId ?? null,
        paymentReference: day.paymentReference ?? null,
        paymentId: null,
      } satisfies DayMealPaymentListItem;
    })
    .filter((row): row is DayMealPaymentListItem => row != null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function dayMealPaymentInSection(
  item: DayMealPaymentListItem,
  section: DayMealPaymentsSection,
): boolean {
  switch (section) {
    case 'actionNeeded':
      return (
        item.displayStatus === 'PENDING' ||
        item.displayStatus === 'OVERDUE' ||
        item.displayStatus === 'REJECTED'
      );
    case 'underReview':
      return item.displayStatus === 'PENDING_APPROVAL';
    case 'history':
      return item.displayStatus === 'PAID';
    default:
      return false;
  }
}

export function filterDayMealPaymentsInSection(
  items: DayMealPaymentListItem[],
  section: DayMealPaymentsSection,
): DayMealPaymentListItem[] {
  return items.filter(item => dayMealPaymentInSection(item, section));
}

export function countDayMealPaymentsInSection(
  items: DayMealPaymentListItem[],
  section: DayMealPaymentsSection,
): number {
  return filterDayMealPaymentsInSection(items, section).length;
}

const DAY_MEAL_PAYMENT_SECTION_ORDER: DayMealPaymentsSection[] = [
  'actionNeeded',
  'underReview',
  'history',
];

/** Prefer the first section that has items (Action needed → Under review → History). */
export function resolvePreferredDayMealPaymentsSection(
  items: DayMealPaymentListItem[],
  current: DayMealPaymentsSection = 'actionNeeded',
): DayMealPaymentsSection {
  if (countDayMealPaymentsInSection(items, current) > 0) {
    return current;
  }
  for (const section of DAY_MEAL_PAYMENT_SECTION_ORDER) {
    if (countDayMealPaymentsInSection(items, section) > 0) {
      return section;
    }
  }
  return current;
}

export function buildDayMealPaymentMonthSummary(
  items: DayMealPaymentListItem[],
  month: string,
): DayMealPaymentMonthSummary {
  const currencyCode = items[0]?.currencyCode ?? 'INR';
  const actionNeeded = items.filter(
    item =>
      item.displayStatus === 'PENDING' ||
      item.displayStatus === 'OVERDUE' ||
      item.displayStatus === 'REJECTED',
  );
  const underReview = items.filter(item => item.displayStatus === 'PENDING_APPROVAL');
  const paid = items.filter(item => item.displayStatus === 'PAID');

  const pendingAmount = sumKnownAmounts(actionNeeded);
  const collectedAmount = sumKnownAmounts(paid);
  const reviewAmount = sumKnownAmounts(underReview);

  return {
    month,
    pendingAmount,
    collectedAmount,
    totalAmount:
      pendingAmount == null || collectedAmount == null || reviewAmount == null
        ? null
        : pendingAmount + collectedAmount + reviewAmount,
    pendingCount: actionNeeded.length,
    currencyCode,
  };
}

export function selectableDayMealPayments(items: DayMealPaymentListItem[]): DayMealPaymentListItem[] {
  return items.filter(
    item =>
      item.displayStatus === 'PENDING' ||
      item.displayStatus === 'OVERDUE' ||
      item.displayStatus === 'REJECTED',
  );
}
