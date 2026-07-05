import type { UniversalPaymentStatus } from '../api/types';

/** Statuses awaiting owner review (Submitted tab). */
export const SUBMITTED_REVIEW_STATUSES: UniversalPaymentStatus[] = [
  'PROOF_UPLOADED',
  'UNDER_REVIEW',
];

export function isSubmittedForReview(status: UniversalPaymentStatus): boolean {
  return SUBMITTED_REVIEW_STATUSES.includes(status);
}

export function isPaymentActionable(status: UniversalPaymentStatus): boolean {
  return status === 'PENDING' || status === 'REJECTED';
}

export function isAwaitingOwnerReview(status: UniversalPaymentStatus): boolean {
  return status === 'UNDER_REVIEW' || status === 'PROOF_UPLOADED';
}
