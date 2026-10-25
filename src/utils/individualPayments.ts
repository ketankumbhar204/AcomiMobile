import type { SpacePaymentResponse } from '../api/types';
import type { PaymentListFilterState, PaymentSortOption } from './paymentLedger';

export function individualPaymentStatus(payment: SpacePaymentResponse): string {
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
    const current = individualPaymentStatus(payment);
    if (status === 'UNDER_REVIEW') {
      if (current !== 'UNDER_REVIEW' && current !== 'PROOF_UPLOADED') {
        return false;
      }
    } else if (current !== status) {
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
    return status === 'PAID';
  }
  if (preset === 'pending') {
    return status === 'PENDING';
  }
  if (preset === 'underReview') {
    return status === 'UNDER_REVIEW' || status === 'PROOF_UPLOADED';
  }
  return true;
}

function matchesStatusSet(payment: SpacePaymentResponse, statuses: Set<string>): boolean {
  if (statuses.size === 0) {
    return true;
  }
  const status = individualPaymentStatus(payment);
  if (statuses.has(status)) {
    return true;
  }
  return statuses.has('UNDER_REVIEW') && status === 'PROOF_UPLOADED';
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
