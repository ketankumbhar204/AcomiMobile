import type { DashboardFinancialSummary, MemberPaymentLedgerRow, MemberPaymentStatus } from '../api/types';

export type PaymentLedgerFilter = 'all' | 'pending' | 'collected' | 'underReview';

export type PaymentSortOption = 'due_desc' | 'name_asc' | 'name_desc';

export const PAYMENT_STATUSES: MemberPaymentStatus[] = [
  'PAID',
  'PENDING',
  'PARTIAL',
  'UNDER_REVIEW',
];

export const PAYMENT_SORT_OPTIONS: PaymentSortOption[] = ['due_desc', 'name_asc', 'name_desc'];

export const PAYMENT_FILTER_OPTION_COUNT =
  PAYMENT_STATUSES.length + PAYMENT_SORT_OPTIONS.length;

export const DEFAULT_PAYMENT_SORT: PaymentSortOption = 'due_desc';

export type PaymentListFilterState = {
  statuses: Set<MemberPaymentStatus>;
  sort: PaymentSortOption;
  /** Snapshot shortcuts from the financial summary cards. */
  preset?: 'collected' | 'pending' | 'underReview' | null;
};

export function defaultPaymentListFilters(): PaymentListFilterState {
  return {
    statuses: new Set(),
    sort: DEFAULT_PAYMENT_SORT,
    preset: null,
  };
}

export function paymentFiltersFromLegacy(filter: PaymentLedgerFilter): PaymentListFilterState {
  switch (filter) {
    case 'pending':
      return { statuses: new Set(), sort: DEFAULT_PAYMENT_SORT, preset: 'pending' };
    case 'collected':
      return { statuses: new Set(), sort: DEFAULT_PAYMENT_SORT, preset: 'collected' };
    case 'underReview':
      return { statuses: new Set(), sort: DEFAULT_PAYMENT_SORT, preset: 'underReview' };
    default:
      return defaultPaymentListFilters();
  }
}

export function countPaymentListFilters(filters: PaymentListFilterState): number {
  let count = 0;
  if (filters.preset) {
    count += 1;
  } else if (filters.statuses.size > 0 && filters.statuses.size < PAYMENT_STATUSES.length) {
    count += 1;
  }
  if (filters.sort !== DEFAULT_PAYMENT_SORT) {
    count += 1;
  }
  return count;
}

export function isPrepaidPaymentRow(row: MemberPaymentLedgerRow): boolean {
  return row.mealBillingType === 'PREPAID_BALANCE';
}

export function isPrepaidOnlyLedger(summary: DashboardFinancialSummary | null | undefined): boolean {
  return summary?.prepaidBalance != null && summary.mixedMealBilling !== true;
}

/** Customer still owes action — excludes under-review (owner action). */
export function isPendingPaymentRow(row: MemberPaymentLedgerRow): boolean {
  if (
    row.status === 'PENDING' ||
    row.status === 'PARTIAL' ||
    row.status === 'UPDATE_REQUESTED' ||
    row.status === 'REJECTED'
  ) {
    return true;
  }
  return (row.pending ?? 0) > 0 && row.status !== 'UNDER_REVIEW';
}

export function isUnderReviewPaymentRow(row: MemberPaymentLedgerRow): boolean {
  return row.status === 'UNDER_REVIEW' || (row.underReview ?? 0) > 0;
}

/** Members with money collected this month (pack sales for prepaid, dues for pay-per-meal). */
export function isCollectedPaymentRow(row: MemberPaymentLedgerRow): boolean {
  const collected = row.collected ?? 0;
  if (collected <= 0) {
    return false;
  }
  if (isPrepaidPaymentRow(row)) {
    return true;
  }
  return row.status === 'PAID' || row.status === 'PARTIAL';
}

function matchesPaymentStatus(
  row: MemberPaymentLedgerRow,
  selected: Set<MemberPaymentStatus>,
): boolean {
  if (selected.size === 0 || selected.size >= PAYMENT_STATUSES.length) {
    return row.status !== 'NONE';
  }
  return selected.has(row.status);
}

function sortPaymentRows(
  rows: MemberPaymentLedgerRow[],
  sort: PaymentSortOption,
): MemberPaymentLedgerRow[] {
  return [...rows].sort((a, b) => {
    switch (sort) {
      case 'name_desc':
        return b.memberName.localeCompare(a.memberName);
      case 'name_asc':
        return a.memberName.localeCompare(b.memberName);
      case 'due_desc':
      default: {
        const pendingA = a.pending ?? 0;
        const pendingB = b.pending ?? 0;
        if (pendingB !== pendingA) {
          return pendingB - pendingA;
        }
        return a.memberName.localeCompare(b.memberName);
      }
    }
  });
}

export function applyPaymentLedgerFilter(
  members: MemberPaymentLedgerRow[],
  filters: PaymentListFilterState,
  search = '',
): MemberPaymentLedgerRow[] {
  const q = search.trim().toLowerCase();

  const byStatus = (() => {
    if (filters.preset === 'pending') {
      return members.filter(isPendingPaymentRow);
    }
    if (filters.preset === 'collected') {
      return members.filter(isCollectedPaymentRow);
    }
    if (filters.preset === 'underReview') {
      return members.filter(isUnderReviewPaymentRow);
    }
    return members.filter(row => matchesPaymentStatus(row, filters.statuses));
  })();

  const filtered = byStatus.filter(row => {
    if (!q) {
      return true;
    }
    return row.memberName.toLowerCase().includes(q);
  });

  return sortPaymentRows(filtered, filters.sort);
}

export function countPaymentLedgerFilters(
  members: MemberPaymentLedgerRow[],
): Record<PaymentLedgerFilter, number> {
  return {
    all: members.length,
    pending: members.filter(isPendingPaymentRow).length,
    collected: members.filter(isCollectedPaymentRow).length,
    underReview: members.filter(isUnderReviewPaymentRow).length,
  };
}
