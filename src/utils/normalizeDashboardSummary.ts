import type {
  DashboardAttentionItem,
  DashboardFinancialSummary,
  DashboardSummaryResponse,
  MemberPaymentLedgerResponse,
  MemberPaymentLedgerRow,
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

export function normalizeFinancialSummary(raw: unknown): DashboardFinancialSummary {
  const row = (raw ?? {}) as Record<string, unknown>;
  const expectedCharges = toNumber(row.expectedCharges);
  const collected = toNumber(row.collected);
  return {
    expectedCharges,
    collected,
    pending: toNumber(row.pending) ?? computePending(expectedCharges, collected),
    currencyCode: typeof row.currencyCode === 'string' ? row.currencyCode : 'INR',
    source: row.source as DashboardFinancialSummary['source'],
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
  };
}

export function normalizePaymentLedger(raw: MemberPaymentLedgerResponse): MemberPaymentLedgerResponse {
  return {
    ...raw,
    summary: normalizeFinancialSummary(raw.summary),
    members: (raw.members ?? []).map(normalizeLedgerRow),
  };
}
