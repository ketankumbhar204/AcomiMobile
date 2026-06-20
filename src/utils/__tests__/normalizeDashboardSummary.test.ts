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
});
