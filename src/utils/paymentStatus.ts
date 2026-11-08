import type { UniversalPaymentStatus } from '../api/types';

/** Statuses awaiting owner review (Submitted tab). */
export const SUBMITTED_REVIEW_STATUSES: UniversalPaymentStatus[] = [
  'PROOF_UPLOADED',
  'UNDER_REVIEW',
];

export const CHANGES_REQUESTED_STATUSES: UniversalPaymentStatus[] = ['UPDATE_REQUESTED'];

export function isSubmittedForReview(status: UniversalPaymentStatus): boolean {
  return SUBMITTED_REVIEW_STATUSES.includes(status);
}

export function isChangesRequested(status: UniversalPaymentStatus): boolean {
  return status === 'UPDATE_REQUESTED';
}

export function isPaymentActionable(status: UniversalPaymentStatus): boolean {
  return status === 'PENDING' || status === 'REJECTED' || status === 'UPDATE_REQUESTED';
}

export function canCancelUnpaidPayment(status: UniversalPaymentStatus | null | undefined): boolean {
  return (
    status === 'PENDING' ||
    status === 'PROOF_UPLOADED' ||
    status === 'UNDER_REVIEW' ||
    status === 'UPDATE_REQUESTED' ||
    status === 'REJECTED'
  );
}

export function canSettleCollectedPayment(
  status: UniversalPaymentStatus | null | undefined,
): boolean {
  return status === 'PAID';
}

/** Remaining cash that can still be refunded (collected − refunded − retained). */
export function remainingRefundableAmount(payment: {
  amount?: number | null;
  paidAmount?: number | null;
  refundedAmount?: number | null;
  retainedAmount?: number | null;
}): number {
  const collected = Number(payment.paidAmount ?? payment.amount ?? 0);
  const refunded = Number(payment.refundedAmount ?? 0);
  const retained = Number(payment.retainedAmount ?? 0);
  return Math.max(0, collected - refunded - retained);
}

export function isAwaitingOwnerReview(status: UniversalPaymentStatus): boolean {
  return status === 'UNDER_REVIEW' || status === 'PROOF_UPLOADED';
}

/** Owner may review or change a decision before the tenant resubmits. */
export function isOwnerReviewActionable(status: UniversalPaymentStatus): boolean {
  return (
    isSubmittedForReview(status) ||
    status === 'UPDATE_REQUESTED' ||
    status === 'REJECTED'
  );
}

/** Tenant may correct proof details while owner has not yet approved or rejected. */
export function isPaymentProofEditable(status: UniversalPaymentStatus): boolean {
  return status === 'UNDER_REVIEW' || status === 'PROOF_UPLOADED';
}

/**
 * A submitted proof is waiting on the owner. That status wins over a stale overdue flag,
 * which only describes customer-action dues.
 */
const CLOSED_PAYMENT_STATUSES = new Set<UniversalPaymentStatus>([
  'PAID',
  'REFUNDED',
  'CANCELLED',
]);

export function displayPaymentStatus(payment: {
  paymentStatus: UniversalPaymentStatus;
  isOverdue?: boolean | null;
}): UniversalPaymentStatus | 'OVERDUE' {
  if (isAwaitingOwnerReview(payment.paymentStatus)) {
    return payment.paymentStatus;
  }
  if (CLOSED_PAYMENT_STATUSES.has(payment.paymentStatus)) {
    return payment.paymentStatus;
  }
  if (payment.isOverdue) {
    return 'OVERDUE';
  }
  return payment.paymentStatus;
}

export function showsPaymentOverdueCue(payment: {
  paymentStatus: UniversalPaymentStatus;
  isOverdue?: boolean | null;
}): boolean {
  if (
    CLOSED_PAYMENT_STATUSES.has(payment.paymentStatus) ||
    isAwaitingOwnerReview(payment.paymentStatus)
  ) {
    return false;
  }
  return Boolean(payment.isOverdue);
}
