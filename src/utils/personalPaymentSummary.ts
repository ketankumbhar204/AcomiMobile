import type { SpacePaymentResponse, SpaceType } from '../api/types';

/**
 * Day-meal collection is a mess billing surface.
 * A lodging tenant with no meal plan must not be treated as pay-per-meal.
 */
export function usesDayMealPayments(input: {
  spaceType?: SpaceType | null;
  prepaidBilling?: boolean | null;
  mealBillingType?: string | null;
}): boolean {
  if (input.spaceType !== 'MESS') {
    return false;
  }
  if (input.prepaidBilling) {
    return false;
  }
  return input.mealBillingType == null || input.mealBillingType === 'PAY_PER_MEAL';
}

export type PersonalPaymentSummary = {
  totalDue: number | null;
  amountPaid: number | null;
  outstanding: number | null;
  nextDueDate: string | null;
};

const UNDER_REVIEW = new Set(['UNDER_REVIEW', 'PROOF_UPLOADED']);

function asMoney(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(Number(value))) {
    return null;
  }
  return Number(value);
}

/**
 * Month totals from the member's own charge rows.
 * Missing amounts stay unknown. A real zero is kept.
 * Totals are not rebuilt from rent or deposit contracts.
 */
export function summarizePersonalPayments(
  payments: SpacePaymentResponse[],
): PersonalPaymentSummary {
  if (payments.length === 0) {
    return {
      totalDue: null,
      amountPaid: null,
      outstanding: null,
      nextDueDate: null,
    };
  }

  let totalDue = 0;
  let sawDue = false;
  let amountPaid = 0;
  let sawPaid = false;
  let outstanding = 0;
  let sawOutstanding = false;
  let nextDueDate: string | null = null;

  for (const payment of payments) {
    const amount = asMoney(payment.amount);
    if (amount != null) {
      totalDue += amount;
      sawDue = true;
    }

    const recordedPaid = asMoney(payment.paidAmount);
    if (recordedPaid != null) {
      amountPaid += recordedPaid;
      sawPaid = true;
    } else if (payment.paymentStatus === 'PAID' && amount != null) {
      amountPaid += amount;
      sawPaid = true;
    }

    const recordedOutstanding = asMoney(payment.outstandingAmount);
    if (recordedOutstanding != null) {
      outstanding += recordedOutstanding;
      sawOutstanding = true;
    } else if (payment.paymentStatus === 'PAID') {
      sawOutstanding = true;
    }

    const settled =
      payment.paymentStatus === 'PAID' || UNDER_REVIEW.has(payment.paymentStatus);
    const stillDue =
      !settled &&
      (recordedOutstanding == null || recordedOutstanding > 0.009);
    if (stillDue && payment.dueDate && (nextDueDate == null || payment.dueDate < nextDueDate)) {
      nextDueDate = payment.dueDate;
    }
  }

  return {
    totalDue: sawDue ? totalDue : null,
    amountPaid: sawPaid ? amountPaid : null,
    outstanding: sawOutstanding ? outstanding : null,
    nextDueDate,
  };
}
