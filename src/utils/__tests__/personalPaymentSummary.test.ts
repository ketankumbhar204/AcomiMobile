import type { SpacePaymentResponse } from '../../api/types';
import {
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

    expect(summary.totalDue).toBe(9000);
    expect(summary.amountPaid).toBe(3000);
    expect(summary.outstanding).toBe(6000);
    expect(summary.nextDueDate).toBe('2026-10-05');
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
    expect(summary.outstanding).toBe(0);
    expect(summary.amountPaid).toBe(6000);
    expect(summary.nextDueDate).toBeNull();
  });

  it('leaves totals unknown when the month has no charges', () => {
    expect(summarizePersonalPayments([])).toEqual({
      totalDue: null,
      amountPaid: null,
      outstanding: null,
      nextDueDate: null,
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
    expect(summary.nextDueDate).toBe('2026-10-12');
  });
});
