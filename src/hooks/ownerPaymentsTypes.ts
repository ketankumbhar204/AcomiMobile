import type {
  DashboardFinancialSummary,
  MemberPaymentLedgerRow,
  OwnerPaymentsMonthCounts,
  SpacePaymentResponse,
  SpaceType,
} from '../api/types';

export type { OwnerPaymentsMonthCounts };

export type OwnerPaymentsMonthSnapshot = {
  month: string;
  spaceType: SpaceType | null;
  summary: DashboardFinancialSummary;
  members: MemberPaymentLedgerRow[];
  payments: SpacePaymentResponse[];
  counts: OwnerPaymentsMonthCounts;
};

/** Payments summary screen cache. It does not include the member ledger. */
export type OwnerPaymentsSummaryCacheEntry = {
  financial: DashboardFinancialSummary;
  counts: OwnerPaymentsMonthCounts;
};

export type OwnerPaymentsCacheValue =
  | OwnerPaymentsMonthSnapshot
  | OwnerPaymentsSummaryCacheEntry;
