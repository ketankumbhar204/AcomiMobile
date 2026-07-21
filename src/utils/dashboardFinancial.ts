import type { DashboardFinancialSummary, MemberPaymentLedgerRow } from '../api/types';

export type SpaceFinancialSnapshot = DashboardFinancialSummary;

export function currentMonthKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function monthDateRange(month: string): { from: string; to: string } {
  const [year, monthNum] = month.split('-').map(Number);
  const lastDay = new Date(year, monthNum, 0).getDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function sumNullable(values: Array<number | null | undefined>): number | null {
  let total = 0;
  let hasValue = false;
  for (const value of values) {
    if (value == null) {
      continue;
    }
    total += value;
    hasValue = true;
  }
  return hasValue ? total : null;
}

/**
 * Customer-action pending = expected − collected − under review.
 * Under review is owner-owned and must not inflate "Pending".
 */
export function computePending(
  expectedCharges: number | null,
  collected: number | null,
  underReview: number | null = null,
): number | null {
  if (expectedCharges == null) {
    return null;
  }
  const collectedAmount = collected ?? 0;
  const underReviewAmount = underReview ?? 0;
  return Math.max(0, expectedCharges - collectedAmount - underReviewAmount);
}

export function buildFinancialSummary(
  expectedCharges: number | null,
  collected: number | null,
  currencyCode = 'INR',
  source?: DashboardFinancialSummary['source'],
  underReview: number | null = null,
): DashboardFinancialSummary {
  return {
    expectedCharges,
    collected,
    underReview,
    pending: computePending(expectedCharges, collected, underReview),
    currencyCode,
    source,
  };
}

export function mergeFinancialSummaries(
  parts: DashboardFinancialSummary[],
): DashboardFinancialSummary {
  const currencyCode = parts.find(part => part.currencyCode)?.currencyCode ?? 'INR';
  const expectedCharges = sumNullable(parts.map(part => part.expectedCharges));
  const collected = sumNullable(parts.map(part => part.collected));
  const underReview = sumNullable(parts.map(part => part.underReview));
  const sources = new Set(parts.map(part => part.source).filter(Boolean));

  let source: DashboardFinancialSummary['source'] = 'API';
  if (sources.size > 1) {
    source = 'HYBRID';
  } else if (sources.size === 1) {
    source = [...sources][0] as DashboardFinancialSummary['source'];
  }

  return buildFinancialSummary(expectedCharges, collected, currencyCode, source, underReview);
}

export function aggregateFinancialFromRows(
  rows: MemberPaymentLedgerRow[],
  source?: DashboardFinancialSummary['source'],
): DashboardFinancialSummary {
  const currencyCode = rows.find(row => row.currencyCode)?.currencyCode ?? 'INR';
  const expectedCharges = sumNullable(rows.map(row => row.expectedCharges));
  const collected = sumNullable(rows.map(row => row.collected));
  const underReview = sumNullable(rows.map(row => row.underReview));
  return buildFinancialSummary(expectedCharges, collected, currencyCode, source, underReview);
}

export function derivePaymentStatus(
  expected: number | null,
  collected: number | null,
  underReview: number | null = null,
): import('../api/types').MemberPaymentStatus {
  const pending = computePending(expected, collected, underReview);
  if (pending != null && pending > 0) {
    if ((collected ?? 0) > 0 && (underReview ?? 0) <= 0) {
      return 'PARTIAL';
    }
    return 'PENDING';
  }
  if ((underReview ?? 0) > 0) {
    return 'UNDER_REVIEW';
  }
  if (expected == null || expected <= 0) {
    return collected != null && collected > 0 ? 'PAID' : 'NONE';
  }
  if (collected == null || collected <= 0) {
    return 'PENDING';
  }
  if (collected >= expected) {
    return 'PAID';
  }
  return 'PARTIAL';
}

export function canManagePayments(role: string | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER';
}

export function canViewOperationalDashboard(input: {
  canManageMembers: boolean;
  canManageMeals: boolean;
  canManageOccupancy: boolean;
  canViewSpaceOccupancies: boolean;
}): boolean {
  return (
    input.canManageMembers ||
    input.canManageMeals ||
    input.canManageOccupancy ||
    input.canViewSpaceOccupancies
  );
}
