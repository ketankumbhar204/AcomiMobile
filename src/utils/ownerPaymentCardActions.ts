import type { MemberPaymentStatus, SpacePaymentResponse, UniversalPaymentStatus } from '../api/types';

const RECEIVABLE_STATUSES: ReadonlySet<UniversalPaymentStatus> = new Set([
  'PENDING',
  'UNDER_REVIEW',
  'PROOF_UPLOADED',
]);

export function canOwnerMarkPaymentReceived(
  status: UniversalPaymentStatus | string | null | undefined,
): boolean {
  return status != null && RECEIVABLE_STATUSES.has(status as UniversalPaymentStatus);
}

export function canOwnerSendPaymentReminder(reminderEligible?: boolean | null): boolean {
  return Boolean(reminderEligible);
}

export function memberRowShowsReceived(
  status: MemberPaymentStatus | string | null | undefined,
): boolean {
  return status === 'PENDING' || status === 'UNDER_REVIEW';
}

export function memberRowShowsReminder(
  status: MemberPaymentStatus | string | null | undefined,
): boolean {
  return status === 'PENDING' || status === 'REJECTED' || status === 'UPDATE_REQUESTED';
}

export function memberRowShowsOwnerPaymentActions(
  status: MemberPaymentStatus | string | null | undefined,
): boolean {
  return memberRowShowsReceived(status) || memberRowShowsReminder(status);
}

export function receivablePayments(
  payments: readonly SpacePaymentResponse[],
): SpacePaymentResponse[] {
  return payments.filter(payment => canOwnerMarkPaymentReceived(payment.paymentStatus));
}

export function reminderEligiblePayments(
  payments: readonly SpacePaymentResponse[],
): SpacePaymentResponse[] {
  return payments.filter(payment => canOwnerSendPaymentReminder(payment.reminderEligible));
}
