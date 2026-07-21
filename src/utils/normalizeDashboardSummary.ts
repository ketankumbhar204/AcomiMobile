import type {
  DashboardAccommodationOperations,
  DashboardAttentionItem,
  DashboardFinancialSummary,
  DashboardSummaryResponse,
  MemberPaymentLedgerResponse,
  MemberPaymentLedgerRow,
  PendingActionGroup,
  PendingActionsSummary,
  PrepaidBalanceSummary,
  PrepaidBalanceUnit,
  SpaceNotification,
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
    underReview: usePrepaidOnly ? null : toNumber(row.underReview),
    pending: usePrepaidOnly
      ? null
      : toNumber(row.pending)
        ?? computePending(expectedCharges, collectedAmount, toNumber(row.underReview)),
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

function normalizeNotification(raw: unknown): SpaceNotification {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    notificationId: String(row.notificationId ?? ''),
    spaceId: String(row.spaceId ?? ''),
    organizationId: row.organizationId != null ? String(row.organizationId) : null,
    userId: String(row.userId ?? ''),
    actorId: row.actorId != null ? String(row.actorId) : null,
    entityType: String(row.entityType ?? ''),
    entityId: row.entityId != null ? String(row.entityId) : null,
    notificationType: row.notificationType as SpaceNotification['notificationType'],
    category: row.category as SpaceNotification['category'],
    priority: row.priority as SpaceNotification['priority'],
    title: String(row.title ?? ''),
    message: row.message != null ? String(row.message) : null,
    actionLabel: row.actionLabel != null ? String(row.actionLabel) : null,
    actionRoute: row.actionRoute != null ? String(row.actionRoute) : null,
    status: row.status as SpaceNotification['status'],
    readAt: row.readAt != null ? String(row.readAt) : null,
    resolvedAt: row.resolvedAt != null ? String(row.resolvedAt) : null,
    deliveryChannels: Array.isArray(row.deliveryChannels)
      ? (row.deliveryChannels as string[])
      : ['IN_APP'],
    createdAt: String(row.createdAt ?? ''),
    updatedAt: String(row.updatedAt ?? ''),
  };
}

function normalizePendingActionGroup(raw: unknown): PendingActionGroup {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    actionType: row.actionType as PendingActionGroup['actionType'],
    title: String(row.title ?? ''),
    actionLabel: row.actionLabel != null ? String(row.actionLabel) : null,
    actionRoute: row.actionRoute != null ? String(row.actionRoute) : null,
    priority: (row.priority as PendingActionGroup['priority']) ?? 'MEDIUM',
    count: toNumber(row.count) ?? 0,
    items: Array.isArray(row.items) ? row.items.map(normalizeNotification) : [],
  };
}

export function normalizePendingActionsSummary(raw: unknown): PendingActionsSummary {
  const row = (raw ?? {}) as Record<string, unknown>;
  const groups = Array.isArray(row.groups) ? row.groups.map(normalizePendingActionGroup) : [];
  return {
    totalCount: toNumber(row.totalCount) ?? groups.reduce((sum, g) => sum + g.count, 0),
    groups,
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
    pendingActions: raw.pendingActions
      ? normalizePendingActionsSummary(raw.pendingActions)
      : null,
  };
}

function normalizeLedgerRow(raw: MemberPaymentLedgerRow): MemberPaymentLedgerRow {
  const expectedCharges = toNumber(raw.expectedCharges);
  const collected = toNumber(raw.collected);
  const underReview = toNumber(raw.underReview);
  return {
    ...raw,
    expectedCharges,
    collected,
    underReview,
    pending: toNumber(raw.pending) ?? computePending(expectedCharges, collected, underReview),
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
