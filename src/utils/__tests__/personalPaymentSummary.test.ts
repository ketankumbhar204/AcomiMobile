import type { SpacePaymentResponse } from '../../api/types';
import {
  matchesPersonalSummaryFilter,
  summarizePersonalPayments,
  usesDayMealPayments,
} from '../personalPaymentSummary';

function payment(
  patch: Partial<SpacePaymentResponse> & Pick<SpacePaymentResponse, 'paymentId' | 'paymentStatus'>,
): SpacePaymentResponse {
  return {
    amount: 0,
    createdAt: '',
    updatedAt: '',
    ...patch,
  } as SpacePaymentResponse;
}

describe('usesDayMealPayments', () => {
  it('keeps pay-per-meal for a mess customer', () => {
    expect(
      usesDayMealPayments({
        spaceType: 'MESS',
        prepaidBilling: false,
        mealBillingType: 'PAY_PER_MEAL',
      }),
    ).toBe(true);
    expect(
      usesDayMealPayments({
        spaceType: 'MESS',
        prepaidBilling: false,
        mealBillingType: null,
      }),
    ).toBe(true);
  });

  it('does not treat a lodging tenant with no meal plan as pay-per-meal', () => {
    expect(
      usesDayMealPayments({
        spaceType: 'PG',
        prepaidBilling: false,
        mealBillingType: null,
      }),
    ).toBe(false);
    expect(
      usesDayMealPayments({ spaceType: 'HOSTEL', mealBillingType: null }),
    ).toBe(false);
  });

  it('uses charge history for a prepaid mess subscription', () => {
    expect(
      usesDayMealPayments({
        spaceType: 'MESS',
        prepaidBilling: true,
        mealBillingType: 'PREPAID_BALANCE',
      }),
    ).toBe(false);
  });

  it('does not assume mess when the space type is unknown', () => {
    expect(usesDayMealPayments({ spaceType: null, mealBillingType: null })).toBe(false);
  });
});

describe('summarizePersonalPayments', () => {
  it('sums the selected month without treating a missing amount as zero', () => {
    const summary = summarizePersonalPayments([
      payment({
        paymentId: 'rent',
        paymentStatus: 'PENDING',
        amount: 6000,
        paidAmount: null,
        outstandingAmount: 6000,
        dueDate: '2026-10-05',
      }),
      payment({
        paymentId: 'deposit',
        paymentStatus: 'PAID',
        amount: 3000,
        paidAmount: 3000,
        outstandingAmount: 0,
        dueDate: '2026-10-01',
      }),
    ]);

    expect(summary.totalDue).toBe(6000);
    expect(summary.amountPaid).toBe(3000);
    expect(summary.outstanding).toBe(6000);
    expect(summary.underReviewAmount).toBe(0);
  });

  it('keeps a real zero when every charge is settled', () => {
    const summary = summarizePersonalPayments([
      payment({
        paymentId: 'rent',
        paymentStatus: 'PAID',
        amount: 6000,
        paidAmount: 6000,
        outstandingAmount: 0,
      }),
    ]);
    expect(summary.totalDue).toBe(0);
    expect(summary.outstanding).toBe(0);
    expect(summary.amountPaid).toBe(6000);
    expect(summary.underReviewAmount).toBe(0);
  });

  it('leaves totals unknown when the month has no charges', () => {
    expect(summarizePersonalPayments([])).toEqual({
      totalDue: null,
      amountPaid: null,
      outstanding: null,
      underReviewAmount: null,
    });
  });

  it('does not invent paid or outstanding when those fields are absent', () => {
    const summary = summarizePersonalPayments([
      payment({
        paymentId: 'utility',
        paymentStatus: 'PENDING',
        amount: 400,
        paidAmount: null,
        outstandingAmount: null,
        dueDate: '2026-10-12',
      }),
    ]);
    expect(summary.totalDue).toBe(400);
    expect(summary.amountPaid).toBeNull();
    expect(summary.outstanding).toBeNull();
    expect(summary.underReviewAmount).toBe(0);
  });

  it('sums submitted charge amounts waiting on review', () => {
    const summary = summarizePersonalPayments([
      payment({
        paymentId: 'rent',
        paymentStatus: 'UNDER_REVIEW',
        amount: 6000,
        paidAmount: 0,
        outstandingAmount: 6000,
      }),
      payment({
        paymentId: 'meals',
        paymentStatus: 'PROOF_UPLOADED',
        amount: 1555,
        paidAmount: 0,
        outstandingAmount: 1555,
      }),
      payment({
        paymentId: 'deposit',
        paymentStatus: 'PAID',
        amount: 1000,
        paidAmount: 1000,
        outstandingAmount: 0,
      }),
      payment({
        paymentId: 'utility',
        paymentStatus: 'PENDING',
        amount: 400,
        outstandingAmount: 400,
      }),
    ]);

    expect(summary.underReviewAmount).toBe(7555);
  });

  it('matches each summary card to the charges that make up that total', () => {
    const pending = payment({
      paymentId: 'utility',
      paymentStatus: 'PENDING',
      amount: 555,
      paidAmount: 0,
      outstandingAmount: 555,
    });
    const review = payment({
      paymentId: 'rent',
      paymentStatus: 'UNDER_REVIEW',
      amount: 6000,
      paidAmount: 0,
      outstandingAmount: 6000,
    });
    const paid = payment({
      paymentId: 'deposit',
      paymentStatus: 'PAID',
      amount: 1000,
      paidAmount: 1000,
      outstandingAmount: 0,
    });
    const partial = payment({
      paymentId: 'meals',
      paymentStatus: 'PENDING',
      amount: 400,
      paidAmount: 100,
      outstandingAmount: 300,
    });

    expect(matchesPersonalSummaryFilter(paid, 'paid')).toBe(true);
    expect(matchesPersonalSummaryFilter(partial, 'paid')).toBe(true);
    expect(matchesPersonalSummaryFilter(pending, 'paid')).toBe(false);

    expect(matchesPersonalSummaryFilter(pending, 'outstanding')).toBe(true);
    expect(matchesPersonalSummaryFilter(review, 'outstanding')).toBe(true);
    expect(matchesPersonalSummaryFilter(partial, 'outstanding')).toBe(true);
    expect(matchesPersonalSummaryFilter(paid, 'outstanding')).toBe(false);

    expect(matchesPersonalSummaryFilter(review, 'underReview')).toBe(true);
    expect(matchesPersonalSummaryFilter(pending, 'underReview')).toBe(false);
    expect(matchesPersonalSummaryFilter(paid, 'due')).toBe(false);
    expect([pending, review, partial].every(row => matchesPersonalSummaryFilter(row, 'due'))).toBe(
      true,
    );
  });
});
