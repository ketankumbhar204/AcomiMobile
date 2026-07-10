import { useCallback, useEffect, useMemo, useState } from 'react';
import { PaymentServiceUnavailableError, paymentsApi } from '../api/paymentsApi';
import type { PaymentRejectionReason, PaymentReviewAction, SpacePaymentResponse, UUID } from '../api/types';
import { currentMonthKey } from '../utils/dashboardFinancial';
import {
  isChangesRequested,
  isSubmittedForReview,
} from '../utils/paymentStatus';

export type PaymentReviewQueue = 'PENDING' | 'HISTORY';

export type PendingReviewFilter = 'SUBMITTED' | 'NEEDS_UPDATE';

export type HistoryReviewFilter = 'PAID' | 'REJECTED';

function matchesPendingFilter(
  payment: SpacePaymentResponse,
  filter: PendingReviewFilter,
): boolean {
  if (filter === 'NEEDS_UPDATE') {
    return isChangesRequested(payment.paymentStatus);
  }
  return isSubmittedForReview(payment.paymentStatus);
}

function matchesHistoryFilter(
  payment: SpacePaymentResponse,
  filter: HistoryReviewFilter,
): boolean {
  if (filter === 'REJECTED') {
    return payment.paymentStatus === 'REJECTED';
  }
  return payment.paymentStatus === 'PAID';
}

export function usePaymentReview(
  spaceId: UUID | null,
  options?: {
    enabled?: boolean;
    month?: string;
    syncExpected?: boolean;
    queue?: PaymentReviewQueue;
    pendingFilter?: PendingReviewFilter;
    historyFilter?: HistoryReviewFilter;
  },
) {
  const enabled = options?.enabled ?? true;
  const month = options?.month ?? currentMonthKey();
  const syncExpected = options?.syncExpected ?? true;
  const queue = options?.queue ?? 'PENDING';
  const pendingFilter = options?.pendingFilter ?? 'SUBMITTED';
  const historyFilter = options?.historyFilter ?? 'PAID';

  const [payments, setPayments] = useState<SpacePaymentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!spaceId || !enabled) {
      setPayments([]);
      setServiceUnavailable(false);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setServiceUnavailable(false);
    try {
      const response = await paymentsApi.listPayments(spaceId, { month, sync: syncExpected });
      setPayments(response.payments);
    } catch (err) {
      if (err instanceof PaymentServiceUnavailableError) {
        setServiceUnavailable(true);
        setPayments([]);
        return;
      }
      console.error('[usePaymentReview] failed', err);
      setError('paymentCollection.errors.loadReview');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, month, spaceId, syncExpected]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filteredPayments = useMemo(() => {
    if (queue === 'PENDING') {
      return payments.filter(p => matchesPendingFilter(p, pendingFilter));
    }
    return payments.filter(p => matchesHistoryFilter(p, historyFilter));
  }, [payments, queue, pendingFilter, historyFilter]);

  const submittedCount = useMemo(
    () => payments.filter(p => isSubmittedForReview(p.paymentStatus)).length,
    [payments],
  );

  const changesRequestedCount = useMemo(
    () => payments.filter(p => isChangesRequested(p.paymentStatus)).length,
    [payments],
  );

  const pendingReviewCount = submittedCount + changesRequestedCount;

  const paidCount = useMemo(
    () => payments.filter(p => p.paymentStatus === 'PAID').length,
    [payments],
  );

  const rejectedCount = useMemo(
    () => payments.filter(p => p.paymentStatus === 'REJECTED').length,
    [payments],
  );

  const historyCount = paidCount + rejectedCount;

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
    submittedCount,
    changesRequestedCount,
    pendingReviewCount,
    paidCount,
    rejectedCount,
    historyCount,
    loading,
    error,
    serviceUnavailable,
    month,
    reload,
    review,
    reviewingId,
  };
}
