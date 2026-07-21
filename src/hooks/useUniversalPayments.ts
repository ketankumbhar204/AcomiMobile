/**
 * @deprecated Prefer `useTenantPaymentsMonth`. Thin adapter for MemberPaymentsScreen etc.
 */
import { useTenantPaymentsMonth } from './useTenantPaymentsMonth';
import type { ListSpacePaymentsParams, UUID } from '../api/types';

export function useUniversalPayments(
  spaceId: UUID | null,
  options?: {
    enabled?: boolean;
    memberId?: UUID;
    month?: string;
    status?: ListSpacePaymentsParams['status'];
  },
) {
  const tenant = useTenantPaymentsMonth(spaceId, {
    enabled: options?.enabled,
    memberId: options?.memberId,
    initialMonth: options?.month,
  });

  const payments =
    options?.status != null
      ? tenant.payments.filter(p => p.paymentStatus === options.status)
      : tenant.payments;

  return {
    payments,
    loading: tenant.loading,
    error: tenant.error,
    serviceUnavailable: tenant.serviceUnavailable,
    month: tenant.month,
    reload: tenant.reload,
    refreshing: tenant.refreshing,
    refreshError: tenant.refreshError,
    replacePayment: tenant.replacePayment,
  };
}
