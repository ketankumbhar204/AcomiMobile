import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PaymentServiceUnavailableError, paymentsApi } from '../api/paymentsApi';
import { ApiError } from '../api/types';
import type {
  PaymentRejectionReason,
  PaymentReviewAction,
  SpaceType,
  UUID,
} from '../api/types';
import { createRequestGuard } from '../modules/orchestrator';
import { currentMonthKey } from '../utils/dashboardFinancial';
import {
  applyPaymentLedgerFilter,
  defaultPaymentListFilters,
  paymentFiltersFromLegacy,
  type PaymentLedgerFilter,
  type PaymentListFilterState,
} from '../utils/paymentLedger';
import {
  computeOwnerPaymentCounts,
  filterReviewPayments,
  type HistoryReviewFilter,
  type PaymentReviewQueue,
  type PendingReviewFilter,
} from '../utils/ownerPaymentFilters';
import {
  invalidateOwnerPaymentsMonth,
  ownerPaymentsMonthCache,
} from '../utils/paymentsMonthCache';
import type { OwnerPaymentsMonthSnapshot } from './ownerPaymentsTypes';

export type { HistoryReviewFilter, PaymentReviewQueue, PendingReviewFilter };
export type { OwnerPaymentsMonthSnapshot } from './ownerPaymentsTypes';

function resolveOwnerErrorKey(error: unknown): string {
  if (error instanceof PaymentServiceUnavailableError) {
    return 'paymentCollection.serviceUnavailable.description';
  }
  if (error instanceof ApiError) {
    if (error.isNetworkError) {
      return 'payments.errors.network';
    }
    if (error.status === 401 || error.status === 403) {
      return 'payments.errors.forbidden';
    }
  }
  return 'payments.errors.loadLedger';
}

/**
 * @deprecated Prefer `usePaymentsSummary` + `usePaymentsMembers` + `usePaymentsReviewList`.
 * Legacy aggregate SoT — kept for compatibility. Default loads are read-only (`sync: false`).
 */
export function useOwnerPaymentsMonth(
  spaceId: UUID,
  spaceType: SpaceType | undefined,
  enabled: boolean,
) {
  const [month, setMonthState] = useState(currentMonthKey());
  const [snapshot, setSnapshot] = useState<OwnerPaymentsMonthSnapshot | null>(null);
  const snapshotRef = useRef<OwnerPaymentsMonthSnapshot | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const [filters, setFilters] = useState<PaymentListFilterState>(defaultPaymentListFilters);
  const [search, setSearch] = useState('');
  const [queue, setQueue] = useState<PaymentReviewQueue>('PENDING');
  const [pendingFilter, setPendingFilter] = useState<PendingReviewFilter>('SUBMITTED');
  const [historyFilter, setHistoryFilter] = useState<HistoryReviewFilter>('PAID');

  const guard = useMemo(() => createRequestGuard(), []);
  /** Don't put spaceType in effect deps — permissions resolving used to restart mid-flight loads. */
  const spaceTypeRef = useRef(spaceType);
  spaceTypeRef.current = spaceType;

  const commitSnapshot = useCallback(
    (next: OwnerPaymentsMonthSnapshot) => {
      snapshotRef.current = next;
      setSnapshot(next);
      setError(null);
      setRefreshError(null);
      setServiceUnavailable(false);
      ownerPaymentsMonthCache.set(ownerPaymentsMonthCache.key([spaceId, next.month]), next);
    },
    [spaceId],
  );

  const load = useCallback(
    async (requestMonth: string, options?: { sync?: boolean; force?: boolean }) => {
      if (!enabled) {
        snapshotRef.current = null;
        setSnapshot(null);
        setLoading(false);
        setRefreshing(false);
        setError(null);
        setRefreshError(null);
        setServiceUnavailable(false);
        return;
      }

      const sync = options?.sync ?? true;
      const cacheKey = ownerPaymentsMonthCache.key([spaceId, requestMonth]);

      if (!options?.force) {
        const cached = ownerPaymentsMonthCache.get(cacheKey);
        if (cached) {
          commitSnapshot(cached);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      const previous = snapshotRef.current;
      const hasAnyData = previous != null;
      const requestId = guard.next();

      if (hasAnyData) {
        setRefreshing(true);
        setRefreshError(null);
      } else {
        setLoading(true);
        setError(null);
        setServiceUnavailable(false);
      }

      try {
        const response = await paymentsApi.getOwnerPaymentsMonth(
          spaceId,
          spaceTypeRef.current ?? 'PG',
          requestMonth,
          sync,
        );
        if (!guard.isCurrent(requestId)) {
          return;
        }
        commitSnapshot({
          month: response.month,
          spaceType: response.spaceType ?? spaceTypeRef.current ?? null,
          summary: response.summary,
          members: response.members,
          payments: response.payments,
          counts: response.counts,
        });
      } catch (err) {
        if (!guard.isCurrent(requestId)) {
          return;
        }
        console.error('[useOwnerPaymentsMonth] failed', err);
        const key = resolveOwnerErrorKey(err);
        const unavailable = err instanceof PaymentServiceUnavailableError;

        if (hasAnyData) {
          setRefreshError(key);
        } else {
          snapshotRef.current = null;
          setSnapshot(null);
          setError(key);
          setServiceUnavailable(unavailable);
        }
      } finally {
        if (guard.isCurrent(requestId)) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [commitSnapshot, enabled, guard, spaceId],
  );

  // Load only when space/month/enabled change — never when spaceType resolves later.
  useEffect(() => {
    if (!enabled) {
      snapshotRef.current = null;
      setSnapshot(null);
      setLoading(false);
      return;
    }
    void load(month, { sync: false });
  }, [enabled, load, month]);

  const setMonth = useCallback((nextMonth: string) => {
    setMonthState(nextMonth);
  }, []);

  const setFilter = useCallback((filter: PaymentLedgerFilter) => {
    setFilters(paymentFiltersFromLegacy(filter));
  }, []);

  const reload = useCallback(
    async (options?: { sync?: boolean }) => {
      invalidateOwnerPaymentsMonth(spaceId, month);
      await load(month, { sync: options?.sync ?? true, force: true });
    },
    [load, month, spaceId],
  );

  const review = useCallback(
    async (
      paymentId: UUID,
      action: PaymentReviewAction,
      remarks?: string,
      rejectionCode?: PaymentRejectionReason,
    ) => {
      setReviewingId(paymentId);
      try {
        const updated = await paymentsApi.reviewPayment(spaceId, paymentId, {
          action,
          remarks,
          rejectionCode,
        });
        const previous = snapshotRef.current;
        if (previous) {
          const payments = previous.payments.map(p =>
            p.paymentId === paymentId ? updated : p,
          );
          commitSnapshot({
            ...previous,
            payments,
            counts: computeOwnerPaymentCounts(payments, previous.members),
          });
        }
        // Soft refresh after review — no expected-payment sync storm.
        invalidateOwnerPaymentsMonth(spaceId, month);
        await load(month, { sync: false, force: true });
        return updated;
      } finally {
        setReviewingId(null);
      }
    },
    [commitSnapshot, load, month, spaceId],
  );

  const members = snapshot?.members ?? [];
  const payments = snapshot?.payments ?? [];
  const counts = snapshot?.counts;

  const filteredMembers = useMemo(
    () => applyPaymentLedgerFilter(members, filters, search),
    [filters, members, search],
  );

  const filteredPayments = useMemo(
    () => filterReviewPayments(payments, queue, pendingFilter, historyFilter),
    [historyFilter, payments, pendingFilter, queue],
  );

  const reviewView = useMemo(
    () => ({
      queue,
      pendingFilter,
      historyFilter,
      payments: filteredPayments,
      allPayments: payments,
      submittedCount: counts?.submitted ?? 0,
      changesRequestedCount: counts?.changesRequested ?? 0,
      pendingReviewCount: counts?.pendingReview ?? 0,
      paidCount: counts?.paid ?? 0,
      rejectedCount: counts?.rejected ?? 0,
      historyCount: counts?.history ?? 0,
      loading: loading && snapshot == null,
      refreshing,
      error: snapshot != null ? refreshError : error,
      refreshError,
      serviceUnavailable: serviceUnavailable && snapshot == null,
      month,
      reload,
      review,
      reviewingId,
    }),
    [
      counts,
      error,
      filteredPayments,
      historyFilter,
      loading,
      month,
      payments,
      pendingFilter,
      queue,
      refreshError,
      refreshing,
      reload,
      review,
      reviewingId,
      serviceUnavailable,
      snapshot,
    ],
  );

  return {
    loading: loading && snapshot == null,
    refreshing,
    error: snapshot == null ? error : null,
    refreshError,
    serviceUnavailable: serviceUnavailable && snapshot == null,
    hasData: snapshot != null,
    month,
    summary: snapshot?.summary ?? null,
    members,
    filteredMembers,
    payments,
    filters,
    search,
    setFilters,
    setFilter,
    setSearch,
    setMonth,
    reload,
    queue,
    setQueue,
    pendingFilter,
    setPendingFilter,
    historyFilter,
    setHistoryFilter,
    review: reviewView,
    submittedCount: counts?.submitted ?? 0,
    changesRequestedCount: counts?.changesRequested ?? 0,
    pendingReviewCount: counts?.pendingReview ?? 0,
    paidCount: counts?.paid ?? 0,
    rejectedCount: counts?.rejected ?? 0,
    historyCount: counts?.history ?? 0,
  };
}

export type OwnerPaymentsReviewView = ReturnType<typeof useOwnerPaymentsMonth>['review'];
