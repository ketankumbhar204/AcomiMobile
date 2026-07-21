import type { PendingActionsSummary, UUID } from '../api/types';
import { currentMonthKey } from './dashboardFinancial';
import { peekDashboardSummary } from './dashboardQueryCache';
import { peekPendingActions } from './pendingActionsQueryCache';
import { ownerPaymentsMonthCache } from './paymentsMonthCache';

type AttentionEntry = {
  count: number;
  /** Prefer payments /summary over pending-actions seed. */
  fromPaymentsSummary: boolean;
};

const store = new Map<string, AttentionEntry>();
const listeners = new Set<() => void>();

function key(spaceId: UUID, month: string): string {
  return `${spaceId}|${month}`;
}

function notify(): void {
  listeners.forEach(listener => listener());
}

export function subscribePaymentsReviewAttention(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Authoritative update from Payments month summary (`counts.submitted`). */
export function publishPaymentsUnderReviewCount(
  spaceId: UUID,
  month: string,
  submittedCount: number,
): void {
  const safe = Math.max(0, Math.floor(submittedCount));
  store.set(key(spaceId, month), { count: safe, fromPaymentsSummary: true });
  notify();
}

/**
 * Seed from dashboard pending-actions already in memory.
 * Does not overwrite a payments-summary value.
 */
export function seedPaymentsUnderReviewFromPendingActions(
  spaceId: UUID,
  month: string,
  pending: PendingActionsSummary | null | undefined,
): void {
  const existing = store.get(key(spaceId, month));
  if (existing?.fromPaymentsSummary) {
    return;
  }
  const group = pending?.groups?.find(g => g.actionType === 'PAYMENT_NEEDS_REVIEW');
  const count = group?.count ?? 0;
  store.set(key(spaceId, month), { count: Math.max(0, count), fromPaymentsSummary: false });
  notify();
}

/**
 * Under-review payment count for the current month — no network.
 * Prefers published Payments summary, then month-summary cache, then pending-actions / dashboard seed.
 */
export function peekPaymentsUnderReviewCount(
  spaceId: UUID,
  month = currentMonthKey(),
): number {
  const published = store.get(key(spaceId, month));
  if (published) {
    return published.count;
  }

  const summaryCache = ownerPaymentsMonthCache.get(
    ownerPaymentsMonthCache.key(['summary', spaceId, month]),
  ) as { counts?: { submitted?: number } } | null;
  if (summaryCache?.counts?.submitted != null) {
    return Math.max(0, summaryCache.counts.submitted);
  }

  const pending =
    peekPendingActions(spaceId, month) ??
    peekDashboardSummary(spaceId, month)?.pendingActions ??
    null;
  const group = pending?.groups?.find(g => g.actionType === 'PAYMENT_NEEDS_REVIEW');
  return Math.max(0, group?.count ?? 0);
}

/** Test-only helper. */
export function resetPaymentsReviewAttentionForTests(): void {
  store.clear();
}
