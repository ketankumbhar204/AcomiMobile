import type {
  MemberPaymentLedgerRow,
  OwnerPaymentsMonthCounts,
  SpacePaymentResponse,
} from '../api/types';
import {
  isChangesRequested,
  isSubmittedForReview,
} from './paymentStatus';
import { isPurePaidPayment, isRefundRelatedPayment } from './paymentRefundDisplay';

export type PaymentReviewQueue = 'PENDING' | 'HISTORY';
export type PendingReviewFilter = 'SUBMITTED' | 'NEEDS_UPDATE';
export type HistoryReviewFilter = 'PAID' | 'REJECTED' | 'REFUNDED' | 'CANCELLED';

export function matchesPendingFilter(
  payment: SpacePaymentResponse,
  filter: PendingReviewFilter,
): boolean {
  if (filter === 'NEEDS_UPDATE') {
    return isChangesRequested(payment.paymentStatus);
  }
  return isSubmittedForReview(payment.paymentStatus);
}

export function matchesHistoryFilter(
  payment: SpacePaymentResponse,
  filter: HistoryReviewFilter,
): boolean {
  if (filter === 'REJECTED') {
    return payment.paymentStatus === 'REJECTED';
  }
  if (filter === 'REFUNDED') {
    return isRefundRelatedPayment(payment);
  }
  if (filter === 'CANCELLED') {
    return payment.paymentStatus === 'CANCELLED';
  }
  return isPurePaidPayment(payment);
}

export function computeOwnerPaymentCounts(
  payments: SpacePaymentResponse[],
  members: MemberPaymentLedgerRow[],
): OwnerPaymentsMonthCounts {
  const submitted = payments.filter(p => isSubmittedForReview(p.paymentStatus)).length;
  const changesRequested = payments.filter(p => isChangesRequested(p.paymentStatus)).length;
  const paid = payments.filter(p => isPurePaidPayment(p)).length;
  const rejected = payments.filter(p => p.paymentStatus === 'REJECTED').length;
  const refunded = payments.filter(p => isRefundRelatedPayment(p)).length;
  const cancelled = payments.filter(p => p.paymentStatus === 'CANCELLED').length;
  const pendingMembers = members.filter(
    row =>
      row.status === 'PENDING' ||
      row.status === 'PARTIAL' ||
      row.status === 'UPDATE_REQUESTED' ||
      row.status === 'REJECTED',
  ).length;

  return {
    pendingReview: submitted + changesRequested,
    submitted,
    changesRequested,
    paid,
    rejected,
    refunded,
    cancelled,
    history: paid + rejected + refunded + cancelled,
    pendingMembers,
  };
}

export function filterReviewPayments(
  payments: SpacePaymentResponse[],
  queue: PaymentReviewQueue,
  pendingFilter: PendingReviewFilter,
  historyFilter: HistoryReviewFilter,
): SpacePaymentResponse[] {
  if (queue === 'PENDING') {
    return payments.filter(p => matchesPendingFilter(p, pendingFilter));
  }
  return payments.filter(p => matchesHistoryFilter(p, historyFilter));
}
