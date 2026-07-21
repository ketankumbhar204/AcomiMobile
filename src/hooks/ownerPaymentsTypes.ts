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
