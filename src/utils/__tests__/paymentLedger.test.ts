import {
  applyPaymentLedgerFilter,
  countPaymentLedgerFilters,
  isCollectedPaymentRow,
  isPrepaidOnlyLedger,
  paymentFiltersFromLegacy,
} from '../paymentLedger';
import type { MemberPaymentLedgerRow } from '../../api/types';

function row(overrides: Partial<MemberPaymentLedgerRow>): MemberPaymentLedgerRow {
  return {
    memberId: 'm1',
    memberName: 'Test',
    expectedCharges: null,
    collected: null,
    pending: null,
    currencyCode: 'INR',
    status: 'NONE',
    ...overrides,
  };
}

describe('paymentLedger', () => {
  it('treats prepaid members with pack payments as collected', () => {
    const prepaid = row({
      mealBillingType: 'PREPAID_BALANCE',
      collected: 3000,
      status: 'PAID',
    });
    expect(isCollectedPaymentRow(prepaid)).toBe(true);
    expect(applyPaymentLedgerFilter([prepaid], paymentFiltersFromLegacy('collected'))).toHaveLength(1);
  });

  it('excludes prepaid members without pack payments from collected', () => {
    const prepaid = row({
      mealBillingType: 'PREPAID_BALANCE',
      collected: null,
      status: 'NONE',
    });
    expect(isCollectedPaymentRow(prepaid)).toBe(false);
    expect(countPaymentLedgerFilters([prepaid]).collected).toBe(0);
  });

  it('includes fully paid pay-per-meal members in collected', () => {
    const payPerMeal = row({
      mealBillingType: 'PAY_PER_MEAL',
      expectedCharges: 1200,
      collected: 1200,
      status: 'PAID',
    });
    expect(isCollectedPaymentRow(payPerMeal)).toBe(true);
  });

  it('detects prepaid-only ledger summaries', () => {
    expect(
      isPrepaidOnlyLedger({
        expectedCharges: null,
        collected: 5000,
        pending: null,
        currencyCode: 'INR',
        prepaidBalance: { balanceSold: 30, balanceConsumed: 5, balanceRemaining: 25, amountCollected: 5000 },
      }),
    ).toBe(true);
    expect(
      isPrepaidOnlyLedger({
        expectedCharges: 1000,
        collected: 500,
        pending: 500,
        currencyCode: 'INR',
        prepaidBalance: { balanceSold: 30, balanceConsumed: 5, balanceRemaining: 25, amountCollected: 5000 },
        mixedMealBilling: true,
      }),
    ).toBe(false);
  });
});
