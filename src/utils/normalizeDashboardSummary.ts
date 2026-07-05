import type {
  DashboardAccommodationOperations,
  DashboardAttentionItem,
  DashboardFinancialSummary,
  DashboardSummaryResponse,
  MemberPaymentLedgerResponse,
  MemberPaymentLedgerRow,
  PrepaidBalanceSummary,
  PrepaidBalanceUnit,
} from '../api/types';
import { computePending } from './dashboardFinancial';

function toNumber(value: unknown): number | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizePrepaidBalance(raw: unknown): PrepaidBalanceSummary | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  return {
    balanceSold: toNumber(row.balanceSold),
    balanceConsumed: toNumber(row.balanceConsumed),
    balanceRemaining: toNumber(row.balanceRemaining),
    amountCollected: toNumber(row.amountCollected),
    unit: row.unit as PrepaidBalanceUnit | undefined,
    currencyCode: typeof row.currencyCode === 'string' ? row.currencyCode : undefined,
  };
}

export function normalizeFinancialSummary(raw: unknown): DashboardFinancialSummary {
  const row = (raw ?? {}) as Record<string, unknown>;
  const expectedCharges = toNumber(row.expectedCharges);
  const collected = toNumber(row.collected);
  const mealBillingType = row.mealBillingType as DashboardFinancialSummary['mealBillingType'];
  const prepaidBalance = normalizePrepaidBalance(row.prepaidBalance);
  const mixedMealBilling = row.mixedMealBilling === true;
  const usePrepaidOnly =
    mealBillingType === 'PREPAID_BALANCE' && prepaidBalance != null && !mixedMealBilling;
  const collectedAmount = usePrepaidOnly
    ? collected ?? prepaidBalance?.amountCollected ?? null
    : collected;

  return {
    expectedCharges,
    collected: collectedAmount,
    pending: usePrepaidOnly ? null : toNumber(row.pending) ?? computePending(expectedCharges, collectedAmount),
    currencyCode: typeof row.currencyCode === 'string' ? row.currencyCode : 'INR',
    source: row.source as DashboardFinancialSummary['source'],
    mealBillingType,
    prepaidBalance,
    mixedMealBilling: mixedMealBilling || undefined,
  };
}

function normalizeAttentionItem(raw: unknown): DashboardAttentionItem {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    kind: row.kind as DashboardAttentionItem['kind'],
    scheduledCount: toNumber(row.scheduledCount) ?? undefined,
    totalMeals: toNumber(row.totalMeals) ?? undefined,
    missingMealTypes: Array.isArray(row.missingMealTypes)
      ? (row.missingMealTypes as DashboardAttentionItem['missingMealTypes'])
      : undefined,
    respondedCount: toNumber(row.respondedCount) ?? undefined,
    eligibleCount: toNumber(row.eligibleCount) ?? undefined,
    openPollCount: toNumber(row.openPollCount) ?? undefined,
    overdueCount: toNumber(row.overdueCount) ?? undefined,
    overdueAmount: toNumber(row.overdueAmount),
    currencyCode: typeof row.currencyCode === 'string' ? row.currencyCode : undefined,
    pendingSubscriptionRequestCount: toNumber(row.pendingSubscriptionRequestCount) ?? undefined,
  };
}

function normalizeAccommodationOperations(
  raw: unknown,
): DashboardAccommodationOperations | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  return {
    occupiedBeds: toNumber(row.occupiedBeds) ?? 0,
    vacantBeds: toNumber(row.vacantBeds) ?? 0,
    moveInsThisMonth: toNumber(row.moveInsThisMonth) ?? 0,
    pendingPaymentsCount: toNumber(row.pendingPaymentsCount) ?? 0,
  };
}

export function normalizeDashboardSummary(raw: DashboardSummaryResponse): DashboardSummaryResponse {
  const messOperations = raw.messOperations
    ? {
        ...raw.messOperations,
        todaysHeadcount: raw.messOperations.todaysHeadcount ?? null,
      }
    : null;

  return {
    ...raw,
    financial: normalizeFinancialSummary(raw.financial),
    messOperations,
    accommodationOperations: normalizeAccommodationOperations(raw.accommodationOperations),
    attention: (raw.attention ?? []).map(normalizeAttentionItem),
  };
}

function normalizeLedgerRow(raw: MemberPaymentLedgerRow): MemberPaymentLedgerRow {
  const expectedCharges = toNumber(raw.expectedCharges);
  const collected = toNumber(raw.collected);
  return {
    ...raw,
    expectedCharges,
    collected,
    pending: toNumber(raw.pending) ?? computePending(expectedCharges, collected),
    currencyCode: raw.currencyCode ?? 'INR',
    mealBalanceRemaining: toNumber(raw.mealBalanceRemaining),
    mealBalancePurchased: toNumber(raw.mealBalancePurchased),
    mealBalanceConsumed: toNumber(raw.mealBalanceConsumed),
  };
}

export function normalizePaymentLedger(raw: MemberPaymentLedgerResponse): MemberPaymentLedgerResponse {
  return {
    ...raw,
    summary: normalizeFinancialSummary(raw.summary),
    members: (raw.members ?? []).map(normalizeLedgerRow),
  };
}
