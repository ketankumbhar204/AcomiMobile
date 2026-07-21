import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PaymentServiceUnavailableError, paymentsApi } from '../api/paymentsApi';
import type { SpacePaymentResponse, UUID } from '../api/types';
import { createRequestGuard } from '../modules/orchestrator';
import { currentMonthKey } from '../utils/dashboardFinancial';
import {
  invalidateTenantPaymentsMonth,
  tenantPaymentsMonthCache,
} from '../utils/paymentsMonthCache';

/**
 * Tenant universal (monthly) payments — single month SoT.
 * Tabs/chips filter local state only.
 */
export function useTenantPaymentsMonth(
  spaceId: UUID | null,
  options?: {
    enabled?: boolean;
    memberId?: UUID;
    initialMonth?: string;
  },
) {
  const enabled = options?.enabled ?? true;
  const memberId = options?.memberId;
  const [month, setMonthState] = useState(options?.initialMonth ?? currentMonthKey());
  const [payments, setPayments] = useState<SpacePaymentResponse[]>([]);
  const paymentsRef = useRef<SpacePaymentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const guard = useMemo(() => createRequestGuard(), []);

  const commit = useCallback(
    (next: SpacePaymentResponse[], requestMonth: string) => {
      paymentsRef.current = next;
      setPayments(next);
      setError(null);
      setRefreshError(null);
      setServiceUnavailable(false);
      if (spaceId) {
        tenantPaymentsMonthCache.set(
          tenantPaymentsMonthCache.key([spaceId, memberId ?? '', requestMonth]),
          { payments: next, month: requestMonth },
        );
      }
    },
    [memberId, spaceId],
  );

  const load = useCallback(
    async (requestMonth: string, options?: { force?: boolean }) => {
      if (!spaceId || !enabled) {
        paymentsRef.current = [];
        setPayments([]);
        setLoading(false);
        setRefreshing(false);
        setServiceUnavailable(false);
        return;
      }

      const cacheKey = tenantPaymentsMonthCache.key([spaceId, memberId ?? '', requestMonth]);
      if (!options?.force) {
        const cached = tenantPaymentsMonthCache.get(cacheKey);
        if (cached) {
          commit(cached.payments, cached.month);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      }

      const hasData = paymentsRef.current.length > 0;
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
        const response = await paymentsApi.listPayments(spaceId, {
          month: requestMonth,
          memberId,
          sync: false,
        });
        if (!guard.isCurrent(requestId)) {
          return;
        }
        commit(response.payments, requestMonth);
      } catch (err) {
        if (!guard.isCurrent(requestId)) {
          return;
        }
        if (err instanceof PaymentServiceUnavailableError) {
          if (hasData) {
            setRefreshError('paymentCollection.serviceUnavailable.description');
          } else {
            setServiceUnavailable(true);
            paymentsRef.current = [];
            setPayments([]);
          }
          return;
        }
        console.error('[useTenantPaymentsMonth] failed', err);
        if (hasData) {
          setRefreshError('paymentCollection.errors.loadPayments');
        } else {
          setError('paymentCollection.errors.loadPayments');
          paymentsRef.current = [];
          setPayments([]);
        }
      } finally {
        if (guard.isCurrent(requestId)) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [commit, enabled, guard, memberId, spaceId],
  );

  useEffect(() => {
    void load(month);
  }, [load, month]);

  const setMonth = useCallback((next: string) => {
    setMonthState(next);
  }, []);

  const reload = useCallback(async () => {
    if (spaceId) {
      invalidateTenantPaymentsMonth(spaceId, month);
    }
    await load(month, { force: true });
  }, [load, month, spaceId]);

  const replacePayment = useCallback(
    (updated: SpacePaymentResponse) => {
      const next = paymentsRef.current.map(p =>
        p.paymentId === updated.paymentId ? updated : p,
      );
      commit(next, month);
    },
    [commit, month],
  );

  return {
    month,
    setMonth,
    payments,
    loading: loading && payments.length === 0,
    refreshing,
    error: payments.length === 0 ? error : null,
    refreshError,
    serviceUnavailable: serviceUnavailable && payments.length === 0,
    hasData: payments.length > 0,
    reload,
    replacePayment,
  };
}
