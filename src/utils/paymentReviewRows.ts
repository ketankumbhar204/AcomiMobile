import type {
  PaymentReviewAction,
  PaymentsReviewQueueParam,
  SpacePaymentResponse,
} from '../api/types';
import { isPurePaidPayment, isRefundRelatedPayment } from './paymentRefundDisplay';

export function paymentMatchesReviewQueue(
  paymentOrStatus:
    | SpacePaymentResponse['paymentStatus']
    | Pick<
        SpacePaymentResponse,
        'paymentStatus' | 'paymentCategory' | 'partiallyRefunded' | 'refundedAmount'
      >,
  queue: PaymentsReviewQueueParam,
): boolean {
  const payment =
    typeof paymentOrStatus === 'string' || paymentOrStatus == null
      ? { paymentStatus: paymentOrStatus ?? 'PENDING' }
      : paymentOrStatus;
  const status = payment.paymentStatus ?? 'PENDING';
  switch (queue) {
    case 'SUBMITTED':
      return status === 'UNDER_REVIEW' || status === 'PROOF_UPLOADED';
    case 'NEEDS_UPDATE':
      return status === 'UPDATE_REQUESTED';
    case 'PAID':
      return isPurePaidPayment(payment);
    case 'REJECTED':
      return status === 'REJECTED';
    case 'REFUNDED':
      return isRefundRelatedPayment(payment);
    case 'CANCELLED':
      return status === 'CANCELLED';
    case 'PENDING_REVIEW':
      return (
        status === 'UNDER_REVIEW' ||
        status === 'PROOF_UPLOADED' ||
        status === 'UPDATE_REQUESTED'
      );
    case 'HISTORY':
      return (
        status === 'PAID' ||
        status === 'REJECTED' ||
        status === 'REFUNDED' ||
        status === 'CANCELLED'
      );
    default:
      return true;
  }
}

/** Status the review action just requested. A stale pre-review response must not win. */
export function paymentAfterReview(
  updated: SpacePaymentResponse,
  action: PaymentReviewAction,
): SpacePaymentResponse {
  const expected: SpacePaymentResponse['paymentStatus'] =
    action === 'APPROVE' ? 'PAID' : action === 'REJECT' ? 'REJECTED' : 'UPDATE_REQUESTED';
  const returned = updated.paymentStatus;
  const stillAwaitingReview =
    !returned ||
    returned === 'PENDING' ||
    returned === 'UNDER_REVIEW' ||
    returned === 'PROOF_UPLOADED';
  return {
    ...updated,
    paymentStatus: stillAwaitingReview ? expected : returned,
  };
}

/**
 * Move a reviewed payment into the queue it now belongs to.
 * A payment that leaves the queue is removed. One that newly belongs is inserted once.
 */
export function applyPaymentToReviewRows(
  rows: readonly SpacePaymentResponse[],
  updated: SpacePaymentResponse,
  queue: PaymentsReviewQueueParam,
): { rows: SpacePaymentResponse[]; removed: boolean } {
  const belongs = paymentMatchesReviewQueue(updated, queue);
  const index = rows.findIndex(row => row.paymentId === updated.paymentId);
  if (belongs) {
    if (index < 0) {
      return { rows: [updated, ...rows], removed: false };
    }
    const next = rows.slice();
    next[index] = { ...rows[index], ...updated };
    return { rows: next, removed: false };
  }
  if (index < 0) {
    return { rows: [...rows], removed: false };
  }
  return { rows: rows.filter(row => row.paymentId !== updated.paymentId), removed: true };
}
