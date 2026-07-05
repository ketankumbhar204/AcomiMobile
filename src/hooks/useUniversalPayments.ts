import { useCallback, useEffect, useState } from 'react';
import { PaymentServiceUnavailableError, paymentsApi } from '../api/paymentsApi';
import type { ListSpacePaymentsParams, SpacePaymentResponse, UUID } from '../api/types';
import { currentMonthKey } from '../utils/dashboardFinancial';

export function useUniversalPayments(
  spaceId: UUID | null,
  options?: {
    enabled?: boolean;
    memberId?: UUID;
    month?: string;
    status?: ListSpacePaymentsParams['status'];
  },
) {
  const enabled = options?.enabled ?? true;
  const month = options?.month ?? currentMonthKey();
  const [payments, setPayments] = useState<SpacePaymentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

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
      const response = await paymentsApi.listPayments(spaceId, {
        month,
        memberId: options?.memberId,
        status: options?.status,
      });
      setPayments(response.payments);
    } catch (err) {
      if (err instanceof PaymentServiceUnavailableError) {
        setServiceUnavailable(true);
        setPayments([]);
        return;
      }
      console.error('[useUniversalPayments] failed', err);
      setError('paymentCollection.errors.loadPayments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, month, options?.memberId, options?.status, spaceId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { payments, loading, error, serviceUnavailable, month, reload };
}
