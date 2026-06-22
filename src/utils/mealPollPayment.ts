import type { MealPollPaymentStatus } from '../api/types';

export function canSendPaymentReminder(status?: MealPollPaymentStatus | null): boolean {
  return status === 'PENDING' || status === 'REJECTED';
}

export function hasPrepaidOverflow(
  overflowPayment?: boolean | null,
  overflowAmount?: number | null,
): boolean {
  return overflowPayment === true && (overflowAmount ?? 0) > 0;
}
