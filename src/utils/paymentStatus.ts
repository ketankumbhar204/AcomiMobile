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
