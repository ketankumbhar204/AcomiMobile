import type { SpacePaymentResponse, UniversalPaymentStatus } from '../api/types';

/** REFUND-category child rows are cash-out records, not collections. */
export function isRefundTransaction(payment: {
  paymentCategory?: string | null;
}): boolean {
  return payment.paymentCategory === 'REFUND';
}

/**
 * Strip leading "Refund –" prefixes so titles never show "Refund – Refund – …".
 * For REFUND rows, re-apply a single "Refund · " prefix.
 */
export function formatPaymentListTitle(payment: {
  title?: string | null;
  paymentCategory?: string | null;
}): string {
  let base = (payment.title ?? '').replace(/\s+/g, ' ').trim();
  while (/^refund\s*[—–·\-]\s*/i.test(base)) {
    base = base.replace(/^refund\s*[—–·\-]\s*/i, '').trim();
  }
  if (isRefundTransaction(payment)) {
    return base ? `Refund · ${base}` : 'Refund';
  }
  return base;
}

export type PaymentListDisplayStatus =
  | UniversalPaymentStatus
  | 'OVERDUE'
  | 'PARTIALLY_REFUNDED';

/**
 * List/detail badge status. REFUND child rows always show as Refunded
 * even though the API stores them as PAID completed payouts.
 */
export function paymentListDisplayStatus(payment: {
  paymentStatus?: UniversalPaymentStatus | null;
  paymentCategory?: string | null;
  partiallyRefunded?: boolean | null;
  refundedAmount?: number | null;
  isOverdue?: boolean | null;
}): PaymentListDisplayStatus {
  if (isRefundTransaction(payment)) {
    return 'REFUNDED';
  }
  const status = payment.paymentStatus ?? 'PENDING';
  if (status === 'REFUNDED' || status === 'CANCELLED') {
    return status;
  }
  if (
    payment.partiallyRefunded === true ||
    (status === 'PAID' && Number(payment.refundedAmount ?? 0) > 0)
  ) {
    return 'PARTIALLY_REFUNDED';
  }
  if (status === 'UNDER_REVIEW' || status === 'PROOF_UPLOADED') {
    return status;
  }
  if (payment.isOverdue && status !== 'PAID') {
    return 'OVERDUE';
  }
  return status;
}

export function paymentListStatusLabelKey(status: PaymentListDisplayStatus): string {
  switch (status) {
    case 'PARTIALLY_REFUNDED':
      return 'payments.status.partiallyRefunded';
    case 'REFUNDED':
      return 'payments.status.refunded';
    case 'CANCELLED':
      return 'payments.status.cancelled';
    case 'PAID':
      return 'payments.status.paid';
    case 'PENDING':
      return 'payments.status.pending';
    case 'UNDER_REVIEW':
      return 'payments.status.underReview';
    case 'PROOF_UPLOADED':
      return 'payments.status.submitted';
    case 'UPDATE_REQUESTED':
      return 'payments.status.needsUpdate';
    case 'REJECTED':
      return 'payments.status.rejected';
    case 'OVERDUE':
      return 'paymentCollection.dayMeals.status.overdue';
    default:
      return 'payments.status.none';
  }
}

/** Badge source compatible with PaymentStatusBadge theme mapping. */
export function paymentListBadgeStatus(
  status: PaymentListDisplayStatus,
): UniversalPaymentStatus | 'OVERDUE' | 'PARTIAL' {
  if (status === 'PARTIALLY_REFUNDED') {
    return 'PARTIAL';
  }
  return status;
}

export type SettlementActionKind = 'FULL_REFUND' | 'PARTIAL_REFUND' | 'RETAIN';

/**
 * Settlement amounts from remaining refundable balance.
 * Partial refund closes the remaining balance: retained = remaining − refund.
 */
export function resolveSettlementAmounts(
  action: SettlementActionKind,
  remainingRefundable: number,
  refundInput?: string | number | null,
): { refundAmount: number; retainedAmount: number } {
  const remaining = Math.max(0, Number(remainingRefundable) || 0);
  if (action === 'FULL_REFUND') {
    return { refundAmount: remaining, retainedAmount: 0 };
  }
  if (action === 'RETAIN') {
    return { refundAmount: 0, retainedAmount: remaining };
  }
  const parsed = typeof refundInput === 'number' ? refundInput : Number(refundInput);
  const refund = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  const clamped = Math.min(refund, remaining);
  return {
    refundAmount: clamped,
    retainedAmount: Math.max(0, roundMoney(remaining - clamped)),
  };
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** True when any money was refunded (full, partial, or REFUND child row). */
export function isRefundRelatedPayment(payment: {
  paymentStatus?: string | null;
  paymentCategory?: string | null;
  partiallyRefunded?: boolean | null;
  refundedAmount?: number | null;
}): boolean {
  if (isRefundTransaction(payment)) {
    return true;
  }
  if (payment.paymentStatus === 'REFUNDED') {
    return true;
  }
  if (payment.partiallyRefunded === true) {
    return true;
  }
  return (
    payment.paymentStatus === 'PAID' && Number(payment.refundedAmount ?? 0) > 0
  );
}

/** Pure collected payment with no refund activity. */
export function isPurePaidPayment(payment: {
  paymentStatus?: string | null;
  paymentCategory?: string | null;
  partiallyRefunded?: boolean | null;
  refundedAmount?: number | null;
}): boolean {
  return (
    payment.paymentStatus === 'PAID' &&
    !isRefundTransaction(payment) &&
    !isRefundRelatedPayment(payment)
  );
}

export function matchesPaymentRecordStatusFilter(
  payment: Pick<
    SpacePaymentResponse,
    'paymentStatus' | 'paymentCategory' | 'partiallyRefunded' | 'refundedAmount'
  >,
  selected: Set<string>,
): boolean {
  if (selected.size === 0) {
    return true;
  }
  const status = payment.paymentStatus || 'PENDING';
  if (selected.has('REFUNDED') && isRefundRelatedPayment(payment)) {
    return true;
  }
  if (isRefundTransaction(payment)) {
    return selected.has('REFUNDED');
  }
  if (selected.has('PAID')) {
    return isPurePaidPayment(payment);
  }
  if (selected.has(status) && status !== 'PAID' && status !== 'REFUNDED') {
    return true;
  }
  return selected.has('UNDER_REVIEW') && status === 'PROOF_UPLOADED';
}
