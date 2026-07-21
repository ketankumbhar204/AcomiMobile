/**
 * @deprecated Prefer `usePaymentsReviewList`. Default `syncExpected` is false (read-only).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { paymentsApi } from '../api/paymentsApi';
import type { PaymentRejectionReason, PaymentReviewAction, SpacePaymentResponse, UUID } from '../api/types';
import { createRequestGuard } from '../modules/orchestrator';
import { currentMonthKey } from '../utils/dashboardFinancial';
import {
  filterReviewPayments,
  type HistoryReviewFilter,
  type PaymentReviewQueue,
  type PendingReviewFilter,
} from '../utils/ownerPaymentFilters';
import { PaymentServiceUnavailableError } from '../api/paymentsApi';

export type { PaymentReviewQueue, PendingReviewFilter, HistoryReviewFilter };

export function usePaymentReview(
  spaceId: UUID | null,
  options?: {
    enabled?: boolean;
    month?: string;
    /** Ignored for tab coupling — sync is a fetch policy only. */
    syncExpected?: boolean;
    queue?: PaymentReviewQueue;
    pendingFilter?: PendingReviewFilter;
    historyFilter?: HistoryReviewFilter;
  },
) {
  const enabled = options?.enabled ?? true;
  const month = options?.month ?? currentMonthKey();
  const syncExpected = options?.syncExpected ?? false;
  const queue = options?.queue ?? 'PENDING';
  const pendingFilter = options?.pendingFilter ?? 'SUBMITTED';
  const historyFilter = options?.historyFilter ?? 'PAID';

  const [payments, setPayments] = useState<SpacePaymentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const guard = useMemo(() => createRequestGuard(), []);

  const reload = useCallback(async () => {
    if (!spaceId || !enabled) {
      setPayments([]);
      setServiceUnavailable(false);
      setError(null);
      setRefreshError(null);
      setLoading(false);
      return;
    }

    const hasData = payments.length > 0;
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
      const response = await paymentsApi.listPayments(spaceId, { month, sync: syncExpected });
      if (!guard.isCurrent(requestId)) {
        return;
      }
      setPayments(response.payments);
      setError(null);
      setRefreshError(null);
      setServiceUnavailable(false);
    } catch (err) {
      if (!guard.isCurrent(requestId)) {
        return;
      }
      if (err instanceof PaymentServiceUnavailableError) {
        if (hasData) {
          setRefreshError('paymentCollection.serviceUnavailable.description');
        } else {
          setServiceUnavailable(true);
          setPayments([]);
        }
        return;
      }
      console.error('[usePaymentReview] failed', err);
      if (hasData) {
        setRefreshError('paymentCollection.errors.loadReview');
      } else {
        setError('paymentCollection.errors.loadReview');
        setPayments([]);
      }
    } finally {
      if (guard.isCurrent(requestId)) {
        setLoading(false);
        setRefreshing(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- payments length only for hasData bootstrap
  }, [enabled, guard, month, spaceId, syncExpected]);

  useEffect(() => {
    void reload();
    // month/enabled only — do not rebind on reload identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, month, spaceId]);

  const filteredPayments = useMemo(
    () => filterReviewPayments(payments, queue, pendingFilter, historyFilter),
    [payments, queue, pendingFilter, historyFilter],
  );

  const review = useCallback(
    async (
      paymentId: UUID,
      action: PaymentReviewAction,
      remarks?: string,
      rejectionCode?: PaymentRejectionReason,
    ) => {
      if (!spaceId) {
        return null;
      }
      setReviewingId(paymentId);
      try {
        const updated = await paymentsApi.reviewPayment(spaceId, paymentId, {
          action,
          remarks,
          rejectionCode,
        });
        setPayments(prev => prev.map(p => (p.paymentId === paymentId ? updated : p)));
        return updated;
      } finally {
        setReviewingId(null);
      }
    },
    [spaceId],
  );

  return {
    queue,
    pendingFilter,
    historyFilter,
    payments: filteredPayments,
    allPayments: payments,
    submittedCount: payments.filter(
      p => p.paymentStatus === 'UNDER_REVIEW' || p.paymentStatus === 'PROOF_UPLOADED',
    ).length,
    changesRequestedCount: payments.filter(p => p.paymentStatus === 'UPDATE_REQUESTED').length,
    pendingReviewCount: payments.filter(
      p =>
        p.paymentStatus === 'UNDER_REVIEW' ||
        p.paymentStatus === 'PROOF_UPLOADED' ||
        p.paymentStatus === 'UPDATE_REQUESTED',
    ).length,
    paidCount: payments.filter(p => p.paymentStatus === 'PAID').length,
    rejectedCount: payments.filter(p => p.paymentStatus === 'REJECTED').length,
    historyCount: payments.filter(
      p => p.paymentStatus === 'PAID' || p.paymentStatus === 'REJECTED',
    ).length,
    loading: loading && payments.length === 0,
    refreshing,
    error: payments.length > 0 ? refreshError : error,
    refreshError,
    serviceUnavailable: serviceUnavailable && payments.length === 0,
    month,
    reload,
    review,
    reviewingId,
  };
}
