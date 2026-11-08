import type { SpacePaymentResponse } from '../api/types';
import type { PaymentListFilterState, PaymentSortOption } from './paymentLedger';
import {
  isPurePaidPayment,
  isRefundRelatedPayment,
  isRefundTransaction,
  matchesPaymentRecordStatusFilter,
} from './paymentRefundDisplay';

export function individualPaymentStatus(payment: SpacePaymentResponse): string {
  if (isRefundRelatedPayment(payment)) {
    return 'REFUNDED';
  }
  return payment.paymentStatus || 'PENDING';
}

export function matchesIndividualPayment(
  payment: SpacePaymentResponse,
  options: { status?: string; query?: string; memberId?: string },
): boolean {
  if (options.memberId && payment.memberId !== options.memberId) {
    return false;
  }
  const status = options.status?.trim();
  if (status) {
    if (status === 'REFUNDED') {
      if (!isRefundRelatedPayment(payment)) {
        return false;
      }
    } else if (status === 'PAID') {
      if (!isPurePaidPayment(payment)) {
        return false;
      }
    } else if (status === 'UNDER_REVIEW') {
      const current = individualPaymentStatus(payment);
      if (current !== 'UNDER_REVIEW' && current !== 'PROOF_UPLOADED') {
        return false;
      }
    } else if (individualPaymentStatus(payment) !== status) {
      return false;
    }
  }
  const query = options.query?.trim().toLowerCase();
  if (!query) {
    return true;
  }
  const mobileDigits = (payment.memberMobile ?? '').replace(/\D/g, '');
  const haystack = [payment.memberName, payment.memberMobile, mobileDigits, payment.title, payment.description, payment.paymentType]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (haystack.includes(query)) {
    return true;
  }
  const queryDigits = query.replace(/\D/g, '');
  return queryDigits.length > 0 && mobileDigits.includes(queryDigits);
}

function matchesPreset(
  payment: SpacePaymentResponse,
  preset: PaymentListFilterState['preset'],
): boolean {
  if (!preset) {
    return true;
  }
  const status = individualPaymentStatus(payment);
  if (preset === 'collected') {
    // Gross collections only — REFUND cash-out rows are not income.
    return payment.paymentStatus === 'PAID' && !isRefundTransaction(payment);
  }
  // note: collected KPI still includes partial-refund originals (money was collected).
  if (preset === 'pending') {
    return status === 'PENDING';
  }
  if (preset === 'underReview') {
    return status === 'UNDER_REVIEW' || status === 'PROOF_UPLOADED';
  }
  return true;
}

function matchesStatusSet(payment: SpacePaymentResponse, statuses: Set<string>): boolean {
  return matchesPaymentRecordStatusFilter(payment, statuses);
}

function comparePayments(
  left: SpacePaymentResponse,
  right: SpacePaymentResponse,
  sort: PaymentSortOption,
): number {
  if (sort === 'name_asc' || sort === 'name_desc') {
    const compared = (left.memberName || '').localeCompare(right.memberName || '');
    return sort === 'name_asc' ? compared : -compared;
  }
  return (right.dueDate || '').localeCompare(left.dueDate || '');
}

export function filterIndividualPayments(
  payments: SpacePaymentResponse[],
  filters: PaymentListFilterState,
  query = '',
): SpacePaymentResponse[] {
  return payments
    .filter(
      payment =>
        matchesPreset(payment, filters.preset) &&
        matchesStatusSet(payment, filters.statuses) &&
        matchesIndividualPayment(payment, { query }),
    )
    .sort((left, right) => comparePayments(left, right, filters.sort));
}
