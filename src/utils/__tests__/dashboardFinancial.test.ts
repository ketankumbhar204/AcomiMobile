import {
  aggregateFinancialFromRows,
  buildFinancialSummary,
  computePending,
  derivePaymentStatus,
  mergeFinancialSummaries,
  sumNullable,
} from '../dashboardFinancial';
import type { MemberPaymentLedgerRow } from '../../api/types';

describe('computePending', () => {
  it('returns null when expected is null', () => {
    expect(computePending(null, 100)).toBeNull();
  });

  it('returns full expected when collected is null (PG occupancy)', () => {
    expect(computePending(8000, null)).toBe(8000);
  });

  it('returns expected minus collected when both known', () => {
    expect(computePending(5000, 3000)).toBe(2000);
  });

  it('excludes under-review from pending', () => {
    expect(computePending(750, 0, 180)).toBe(570);
  });

  it('never returns negative pending', () => {
    expect(computePending(1000, 1500)).toBe(0);
  });
});

describe('buildFinancialSummary', () => {
  it('derives pending from expected, collected, and under review', () => {
    const summary = buildFinancialSummary(10000, 4000, 'INR', 'OCCUPANCY', 2000);
    expect(summary).toEqual({
      expectedCharges: 10000,
      collected: 4000,
      underReview: 2000,
      pending: 4000,
      currencyCode: 'INR',
      source: 'OCCUPANCY',
    });
  });
});

describe('mergeFinancialSummaries', () => {
  it('sums meal and occupancy parts for hybrid PG+food', () => {
    const meal = buildFinancialSummary(1500, 500, 'INR', 'MEAL_ACTIVITY', 200);
    const occupancy = buildFinancialSummary(8000, null, 'INR', 'OCCUPANCY');
    const merged = mergeFinancialSummaries([meal, occupancy]);

    expect(merged.expectedCharges).toBe(9500);
    expect(merged.collected).toBe(500);
    expect(merged.underReview).toBe(200);
    expect(merged.pending).toBe(8800);
    expect(merged.source).toBe('HYBRID');
  });

  it('preserves single source when only one part', () => {
    const occupancy = buildFinancialSummary(8000, null, 'INR', 'OCCUPANCY');
    expect(mergeFinancialSummaries([occupancy]).source).toBe('OCCUPANCY');
  });
});

describe('aggregateFinancialFromRows', () => {
  it('aggregates member rows into space summary', () => {
    const rows: MemberPaymentLedgerRow[] = [
      {
        memberId: 'a',
        memberName: 'Alice',
        expectedCharges: 750,
        collected: null,
        underReview: 180,
        pending: 570,
        currencyCode: 'INR',
        status: 'PENDING',
      },
      {
        memberId: 'b',
        memberName: 'Bob',
        expectedCharges: 500,
        collected: 500,
        underReview: null,
        pending: 0,
        currencyCode: 'INR',
        status: 'PAID',
      },
    ];

    const summary = aggregateFinancialFromRows(rows, 'HYBRID');
    expect(summary.expectedCharges).toBe(1250);
    expect(summary.collected).toBe(500);
    expect(summary.underReview).toBe(180);
    expect(summary.pending).toBe(570);
    expect(summary.source).toBe('HYBRID');
  });
});

describe('derivePaymentStatus', () => {
  it('marks PG rent-only rows as pending when collected unknown', () => {
    expect(derivePaymentStatus(8000, null)).toBe('PENDING');
  });

  it('marks mess rows with no expected but collected as paid', () => {
    expect(derivePaymentStatus(null, 200)).toBe('PAID');
  });

  it('marks partial payments correctly', () => {
    expect(derivePaymentStatus(1000, 400)).toBe('PARTIAL');
  });

  it('marks under review when all outstanding is submitted', () => {
    expect(derivePaymentStatus(750, 570, 180)).toBe('UNDER_REVIEW');
  });

  it('prefers pending when customer action remains alongside under review', () => {
    expect(derivePaymentStatus(750, 420, 180)).toBe('PENDING');
  });

  it('marks fully paid rows', () => {
    expect(derivePaymentStatus(1000, 1000)).toBe('PAID');
  });
});

describe('sumNullable', () => {
  it('returns null for empty values', () => {
    expect(sumNullable([])).toBeNull();
    expect(sumNullable([null, undefined])).toBeNull();
  });

  it('skips nulls when summing', () => {
    expect(sumNullable([100, null, 200])).toBe(300);
  });
});
