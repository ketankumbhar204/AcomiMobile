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
  amount: number;
  currencyCode: string;
  paymentStatus: MealPollPaymentStatus | null;
  displayStatus: DayMealPaymentDisplayStatus;
  mealTypes: MealType[];
  paymentBatchId?: string | null;
  paymentId?: string | null;
};

export type DayMealPaymentsSection = 'actionNeeded' | 'underReview' | 'history';

export type DayMealPaymentMonthSummary = {
  month: string;
  pendingAmount: number;
  collectedAmount: number;
  totalAmount: number;
  pendingCount: number;
  currencyCode: string;
};

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
      const amount = day.dayTotal != null ? Number(day.dayTotal) : 0;
      const mealTypes = acceptedMealTypes(day);
      const hasCharge = amount > 0 || mealTypes.length > 0;
      if (!hasCharge && day.paymentStatus == null) {
        return null;
      }
      if (!hasCharge && day.paymentStatus === 'PAID') {
        // Keep paid zero rows out of list noise
        return null;
      }
      if (amount <= 0 && mealTypes.length === 0) {
        return null;
      }

      const paymentStatus = day.paymentStatus ?? null;
      return {
        date: day.date,
        amount: amount > 0 ? amount : 0,
        currencyCode: day.currencyCode ?? activity.summary.currencyCode ?? 'INR',
        paymentStatus,
        displayStatus: resolveDayMealPaymentDisplayStatus(paymentStatus, day.date, todayIso),
        mealTypes,
        paymentBatchId: null,
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

  const pendingAmount = actionNeeded.reduce((sum, item) => sum + item.amount, 0);
  const collectedAmount = paid.reduce((sum, item) => sum + item.amount, 0);
  const reviewAmount = underReview.reduce((sum, item) => sum + item.amount, 0);

  return {
    month,
    pendingAmount,
    collectedAmount,
    totalAmount: pendingAmount + collectedAmount + reviewAmount,
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
