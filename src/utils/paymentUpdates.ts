import type { SpacePaymentResponse } from '../api/types';
import { invalidateDashboardQueries } from './dashboardQueryCache';
import { invalidatePaymentsMonthCaches } from './paymentsMonthCache';

export type PaymentUpdate =
  | { kind: 'payment'; payment: SpacePaymentResponse }
  | { kind: 'month'; spaceId: string; month?: string | null };

type PaymentUpdateListener = (update: PaymentUpdate) => void;

const listeners = new Set<PaymentUpdateListener>();

export function subscribePaymentUpdates(listener: PaymentUpdateListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(update: PaymentUpdate): void {
  const spaceId = update.kind === 'payment' ? update.payment.spaceId : update.spaceId;
  const month = update.kind === 'payment' ? update.payment.month : update.month ?? undefined;
  invalidatePaymentsMonthCaches(spaceId, month || undefined);
  invalidateDashboardQueries();
  listeners.forEach(listener => listener(update));
}

/** Push one changed payment into every open list, badge, and total. */
export function publishPaymentUpdated(payment: SpacePaymentResponse): void {
  emit({ kind: 'payment', payment });
}

/** A payment month changed but no single row was returned (for example a meal proof). */
export function publishPaymentsMonthChanged(spaceId: string, month?: string | null): void {
  emit({ kind: 'month', spaceId, month });
}
