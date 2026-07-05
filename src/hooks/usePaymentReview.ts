import { useCallback, useEffect, useMemo, useState } from 'react';
import { PaymentServiceUnavailableError, paymentsApi } from '../api/paymentsApi';
import type { PaymentRejectionReason, SpacePaymentResponse, UUID } from '../api/types';
import { currentMonthKey } from '../utils/dashboardFinancial';
import { isSubmittedForReview } from '../utils/paymentStatus';

export type PaymentReviewTab = 'SUBMITTED' | 'PAID' | 'REJECTED';

function matchesTab(payment: SpacePaymentResponse, tab: PaymentReviewTab): boolean {
  if (tab === 'SUBMITTED') {
    return isSubmittedForReview(payment.paymentStatus);
  }
  if (tab === 'PAID') {
    return payment.paymentStatus === 'PAID';
  }
  return payment.paymentStatus === 'REJECTED';
}

export function usePaymentReview(
  spaceId: UUID | null,
  options?: { enabled?: boolean; month?: string },
) {
  const enabled = options?.enabled ?? true;
  const month = options?.month ?? currentMonthKey();
  const [tab, setTab] = useState<PaymentReviewTab>('SUBMITTED');
  const [payments, setPayments] = useState<SpacePaymentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!spaceId || !enabled) {
      setPayments([]);
      setServiceUnavailable(false);
      return;
    }

    setLoading(true);
    setError(null);
    setServiceUnavailable(false);
    try {
      const response = await paymentsApi.listPayments(spaceId, { month });
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
  }, [enabled, month, spaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filteredPayments = useMemo(
    () => payments.filter(p => matchesTab(p, tab)),
    [payments, tab],
  );

  const submittedCount = useMemo(
    () => payments.filter(p => isSubmittedForReview(p.paymentStatus)).length,
    [payments],
  );

  const review = useCallback(
    async (
      paymentId: UUID,
      action: 'APPROVE' | 'REJECT',
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
    tab,
    setTab,
    payments: filteredPayments,
    allPayments: payments,
    submittedCount,
    loading,
    error,
    serviceUnavailable,
    month,
    reload,
    review,
    reviewingId,
  };
}
