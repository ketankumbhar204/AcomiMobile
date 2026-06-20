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

  it('never returns negative pending', () => {
    expect(computePending(1000, 1500)).toBe(0);
  });
});

describe('buildFinancialSummary', () => {
  it('derives pending from expected and collected', () => {
    const summary = buildFinancialSummary(10000, 4000, 'INR', 'OCCUPANCY');
    expect(summary).toEqual({
      expectedCharges: 10000,
      collected: 4000,
      pending: 6000,
      currencyCode: 'INR',
      source: 'OCCUPANCY',
    });
  });
});

describe('mergeFinancialSummaries', () => {
  it('sums meal and occupancy parts for hybrid PG+food', () => {
    const meal = buildFinancialSummary(1500, 500, 'INR', 'MEAL_ACTIVITY');
    const occupancy = buildFinancialSummary(8000, null, 'INR', 'OCCUPANCY');
    const merged = mergeFinancialSummaries([meal, occupancy]);

    expect(merged.expectedCharges).toBe(9500);
    expect(merged.collected).toBe(500);
    expect(merged.pending).toBe(9000);
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
        expectedCharges: 8000,
        collected: null,
        pending: 8000,
        currencyCode: 'INR',
        status: 'PENDING',
      },
      {
        memberId: 'b',
        memberName: 'Bob',
        expectedCharges: 500,
        collected: 500,
        pending: 0,
        currencyCode: 'INR',
        status: 'PAID',
      },
    ];

    const summary = aggregateFinancialFromRows(rows, 'HYBRID');
    expect(summary.expectedCharges).toBe(8500);
    expect(summary.collected).toBe(500);
    expect(summary.pending).toBe(8000);
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
