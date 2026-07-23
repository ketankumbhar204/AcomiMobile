import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PaymentServiceUnavailableError, paymentsApi } from '../api/paymentsApi';
import { ApiError } from '../api/types';
import type { DashboardFinancialSummary, OwnerPaymentsMonthCounts, UUID } from '../api/types';
import { createRequestGuard } from '../modules/orchestrator';
import { currentMonthKey } from '../utils/dashboardFinancial';
import {
  invalidateOwnerPaymentsMonth,
  ownerPaymentsMonthCache,
} from '../utils/paymentsMonthCache';
import { publishPaymentsUnderReviewCount } from '../utils/paymentsReviewAttentionCache';

function resolveErrorKey(error: unknown): string {
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

const emptyCounts = (): OwnerPaymentsMonthCounts => ({
  pendingReview: 0,
  submitted: 0,
  changesRequested: 0,
  paid: 0,
  rejected: 0,
  history: 0,
  pendingMembers: 0,
});

/**
 * Lightweight Payments KPIs + tab counts. Never loads member/payment lists.
 */
export function usePaymentsSummary(spaceId: UUID, enabled: boolean) {
  const [month, setMonthState] = useState(currentMonthKey());
  const [financial, setFinancial] = useState<DashboardFinancialSummary | null>(null);
  const [counts, setCounts] = useState<OwnerPaymentsMonthCounts>(emptyCounts);
  const hasDataRef = useRef(false);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const guard = useMemo(() => createRequestGuard(), []);

  const load = useCallback(
    async (requestMonth: string, options?: { force?: boolean }) => {
      if (!enabled) {
        hasDataRef.current = false;
        setFinancial(null);
        setCounts(emptyCounts());
        setLoading(false);
        return;
      }

      const cacheKey = ownerPaymentsMonthCache.key(['summary', spaceId, requestMonth]);
      if (!options?.force) {
        const cached = ownerPaymentsMonthCache.get(cacheKey) as
          | { financial: DashboardFinancialSummary; counts: OwnerPaymentsMonthCounts }
          | null;
        if (cached) {
          const submitted = cached.counts.submitted ?? 0;
          const underReviewAmount = cached.financial?.underReview ?? 0;
          // Stale client cache: review queue has items but Under Review KPI is empty.
          if (submitted > 0 && !(underReviewAmount > 0)) {
            ownerPaymentsMonthCache.invalidate(cacheKey);
          } else {
            hasDataRef.current = true;
            setFinancial(cached.financial);
            setCounts(cached.counts);
            setLoading(false);
            setRefreshing(false);
            if (requestMonth === currentMonthKey()) {
              publishPaymentsUnderReviewCount(
                spaceId,
                requestMonth,
                cached.counts.submitted ?? 0,
              );
            }
            return;
          }
        }
      }

      const hasData = hasDataRef.current;
      const requestId = guard.next();
      if (hasData) {
        setRefreshing(true);
        setRefreshError(null);
      } else {
        setLoading(true);
        setError(null);
        setServiceUnavailable(false);
      }

      try {
        const response = await paymentsApi.getPaymentsSummary(spaceId, requestMonth);
        if (!guard.isCurrent(requestId)) {
          return;
        }
        hasDataRef.current = true;
        setFinancial(response.financial);
        setCounts(response.counts);
        setError(null);
        setRefreshError(null);
        setServiceUnavailable(false);
        ownerPaymentsMonthCache.set(cacheKey, {
          financial: response.financial,
          counts: response.counts,
        });
        if (requestMonth === currentMonthKey()) {
          publishPaymentsUnderReviewCount(spaceId, requestMonth, response.counts.submitted ?? 0);
        }
      } catch (err) {
        if (!guard.isCurrent(requestId)) {
          return;
        }
        const key = resolveErrorKey(err);
        if (hasData) {
          setRefreshError(key);
        } else {
          hasDataRef.current = false;
          setFinancial(null);
          setError(key);
          setServiceUnavailable(err instanceof PaymentServiceUnavailableError);
        }
      } finally {
        if (guard.isCurrent(requestId)) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [enabled, guard, spaceId],
  );

  useEffect(() => {
    void load(month);
  }, [load, month]);

  const setMonth = useCallback((next: string) => {
    setMonthState(next);
  }, []);

  const reload = useCallback(async () => {
    invalidateOwnerPaymentsMonth(spaceId, month);
    ownerPaymentsMonthCache.invalidate(ownerPaymentsMonthCache.key(['summary', spaceId, month]));
    await load(month, { force: true });
  }, [load, month, spaceId]);

  /** Immediate KPI/tab bump after approve / reject / request-update — reload reconciles from server. */
  const applyReviewOutcome = useCallback(
    (action: 'APPROVE' | 'REJECT' | 'REQUEST_UPDATE', amount: number | null | undefined) => {
      const delta = typeof amount === 'number' && Number.isFinite(amount) ? Math.max(0, amount) : 0;
      setCounts(prev => {
        const next = { ...prev };
        if (action === 'APPROVE') {
          next.pendingReview = Math.max(0, prev.pendingReview - 1);
          next.submitted = Math.max(0, prev.submitted - 1);
          next.paid = prev.paid + 1;
          next.history = prev.history + 1;
        } else if (action === 'REJECT') {
          next.pendingReview = Math.max(0, prev.pendingReview - 1);
          next.submitted = Math.max(0, prev.submitted - 1);
          next.rejected = prev.rejected + 1;
          next.history = prev.history + 1;
        } else {
          next.submitted = Math.max(0, prev.submitted - 1);
          next.changesRequested = prev.changesRequested + 1;
        }
        if (month === currentMonthKey()) {
          publishPaymentsUnderReviewCount(spaceId, month, next.submitted);
        }
        return next;
      });
      if (delta <= 0) {
        return;
      }
      setFinancial(prev => {
        if (!prev) {
          return prev;
        }
        const under = prev.underReview ?? 0;
        const collected = prev.collected ?? 0;
        const pending = prev.pending ?? 0;
        if (action === 'APPROVE') {
          const nextUnder = Math.max(0, under - delta);
          return {
            ...prev,
            underReview: nextUnder > 0 ? nextUnder : null,
            collected: collected + delta,
          };
        }
        if (action === 'REJECT' || action === 'REQUEST_UPDATE') {
          const nextUnder = Math.max(0, under - delta);
          return {
            ...prev,
            underReview: nextUnder > 0 ? nextUnder : null,
            pending: pending + delta,
          };
        }
        return prev;
      });
      ownerPaymentsMonthCache.invalidate(ownerPaymentsMonthCache.key(['summary', spaceId, month]));
    },
    [month, spaceId],
  );

  return {
    month,
    setMonth,
    financial,
    counts,
    loading: loading && !hasDataRef.current,
    refreshing,
    error: hasDataRef.current ? null : error,
    refreshError,
    serviceUnavailable: serviceUnavailable && !hasDataRef.current,
    hasData: hasDataRef.current || financial != null,
    reload,
    applyReviewOutcome,
  };
}
