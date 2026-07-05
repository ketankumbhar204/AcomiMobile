import {
  normalizeDashboardSummary,
  normalizeFinancialSummary,
  normalizePaymentLedger,
} from '../normalizeDashboardSummary';

describe('normalizeFinancialSummary', () => {
  it('recomputes pending when backend omits it', () => {
    const result = normalizeFinancialSummary({
      expectedCharges: '8000',
      collected: '2000',
      currencyCode: 'INR',
      source: 'OCCUPANCY',
    });

    expect(result.pending).toBe(6000);
    expect(result.expectedCharges).toBe(8000);
    expect(result.collected).toBe(2000);
  });

  it('treats missing collected as full pending for occupancy', () => {
    const result = normalizeFinancialSummary({
      expectedCharges: 8000,
      collected: null,
      currencyCode: 'INR',
      source: 'OCCUPANCY',
    });

    expect(result.pending).toBe(8000);
  });

  it('normalizes prepaid balance cards for meal balance billing', () => {
    const result = normalizeFinancialSummary({
      mealBillingType: 'PREPAID_BALANCE',
      expectedCharges: null,
      collected: null,
      pending: null,
      currencyCode: 'INR',
      source: 'MEAL_ACTIVITY',
      prepaidBalance: {
        balanceSold: '30',
        balanceConsumed: '12',
        balanceRemaining: '18',
        unit: 'MEALS',
        currencyCode: 'INR',
      },
    });

    expect(result.mealBillingType).toBe('PREPAID_BALANCE');
    expect(result.prepaidBalance?.balanceSold).toBe(30);
    expect(result.prepaidBalance?.balanceConsumed).toBe(12);
    expect(result.prepaidBalance?.balanceRemaining).toBe(18);
    expect(result.pending).toBeNull();
  });

  it('keeps pay-per-meal pending when mixed billing is enabled', () => {
    const result = normalizeFinancialSummary({
      mealBillingType: 'PAY_PER_MEAL',
      mixedMealBilling: true,
      expectedCharges: 1500,
      collected: 500,
      pending: 1000,
      currencyCode: 'INR',
      source: 'MEAL_ACTIVITY',
      prepaidBalance: {
        balanceSold: 30,
        balanceConsumed: 12,
        balanceRemaining: 18,
        unit: 'MEALS',
        currencyCode: 'INR',
      },
    });

    expect(result.mixedMealBilling).toBe(true);
    expect(result.pending).toBe(1000);
    expect(result.prepaidBalance?.balanceSold).toBe(30);
  });
});

describe('normalizePaymentLedger', () => {
  it('normalizes member row pending values', () => {
    const result = normalizePaymentLedger({
      month: '2026-06',
      spaceType: 'PG',
      summary: {
        expectedCharges: 8000,
        collected: null,
        pending: null,
        currencyCode: 'INR',
        source: 'OCCUPANCY',
      },
      members: [
        {
          memberId: 'm1',
          memberName: 'Alice',
          expectedCharges: '8000',
          collected: null,
          pending: null,
          currencyCode: 'INR',
          status: 'PENDING',
        },
      ],
    });

    expect(result.summary.pending).toBe(8000);
    expect(result.members[0].pending).toBe(8000);
  });
});

describe('normalizeDashboardSummary', () => {
  it('normalizes nested financial and attention items', () => {
    const result = normalizeDashboardSummary({
      spaceType: 'MESS',
      month: '2026-06',
      financial: {
        expectedCharges: '1500',
        collected: '500',
        currencyCode: 'INR',
        source: 'MEAL_ACTIVITY',
      },
      messOperations: {
        membersReceivingMeals: 10,
        menusPublishedThisMonth: 2,
        openPollsCount: 1,
        todaysHeadcount: undefined,
        pollRespondedCount: 3,
        pollEligibleCount: 10,
      },
      accommodationOperations: null,
      attention: [
        {
          kind: 'payments_overdue',
          overdueCount: '2',
          overdueAmount: '1000',
          currencyCode: 'INR',
        },
      ],
    });

    expect(result.financial.pending).toBe(1000);
    expect(result.messOperations?.todaysHeadcount).toBeNull();
    expect(result.attention[0].overdueCount).toBe(2);
  });

  it('normalizes accommodation operation counts', () => {
    const result = normalizeDashboardSummary({
      spaceType: 'PG',
      month: '2026-07',
      financial: {
        expectedCharges: 10000,
        collected: null,
        pending: 10000,
        currencyCode: 'INR',
      },
      attention: [],
      accommodationOperations: {
        occupiedBeds: '1',
        vacantBeds: '669',
        moveInsThisMonth: '1',
        pendingPaymentsCount: '1',
      },
    });

    expect(result.accommodationOperations).toEqual({
      occupiedBeds: 1,
      vacantBeds: 669,
      moveInsThisMonth: 1,
      pendingPaymentsCount: 1,
    });
  });
});
