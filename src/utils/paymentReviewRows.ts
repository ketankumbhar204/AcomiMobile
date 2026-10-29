import type {
  PaymentReviewAction,
  PaymentsReviewQueueParam,
  SpacePaymentResponse,
} from '../api/types';

export function paymentMatchesReviewQueue(
  status: SpacePaymentResponse['paymentStatus'],
  queue: PaymentsReviewQueueParam,
): boolean {
  switch (queue) {
    case 'SUBMITTED':
      return status === 'UNDER_REVIEW' || status === 'PROOF_UPLOADED';
    case 'NEEDS_UPDATE':
      return status === 'UPDATE_REQUESTED';
    case 'PAID':
      return status === 'PAID';
    case 'REJECTED':
      return status === 'REJECTED';
    case 'PENDING_REVIEW':
      return (
        status === 'UNDER_REVIEW' ||
        status === 'PROOF_UPLOADED' ||
        status === 'UPDATE_REQUESTED'
      );
    case 'HISTORY':
      return status === 'PAID' || status === 'REJECTED';
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
  const belongs = paymentMatchesReviewQueue(updated.paymentStatus, queue);
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
