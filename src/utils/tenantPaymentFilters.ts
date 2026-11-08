import type { SpacePaymentResponse, UniversalPaymentStatus } from '../api/types';
import { isPurePaidPayment, isRefundRelatedPayment } from './paymentRefundDisplay';

/** Primary tabs on the tenant Payments screen (mirrors owner Pending Review / History chrome). */
export type TenantPaymentsSection = 'actionNeeded' | 'underReview' | 'history';

export type TenantPaymentFilter =
  | 'ALL'
  | 'NEEDS_UPDATE'
  | 'UNDER_REVIEW'
  | 'PAID'
  | 'REJECTED'
  | 'PENDING'
  | 'REFUNDED'
  | 'CANCELLED';

const UNDER_REVIEW: ReadonlySet<UniversalPaymentStatus> = new Set([
  'UNDER_REVIEW',
  'PROOF_UPLOADED',
]);

const HISTORY_STATUSES: ReadonlySet<UniversalPaymentStatus> = new Set([
  'PAID',
  'REFUNDED',
  'CANCELLED',
  'REJECTED',
]);

export function matchesTenantPaymentFilter(
  statusOrPayment:
    | UniversalPaymentStatus
    | Pick<
        SpacePaymentResponse,
        'paymentStatus' | 'paymentCategory' | 'partiallyRefunded' | 'refundedAmount'
      >,
  filter: TenantPaymentFilter,
): boolean {
  const payment =
    typeof statusOrPayment === 'string'
      ? { paymentStatus: statusOrPayment }
      : statusOrPayment;
  const status = (payment.paymentStatus || 'PENDING') as UniversalPaymentStatus;
  switch (filter) {
    case 'ALL':
      return true;
    case 'NEEDS_UPDATE':
      return status === 'UPDATE_REQUESTED';
    case 'UNDER_REVIEW':
      return status === 'UNDER_REVIEW' || status === 'PROOF_UPLOADED';
    case 'PAID':
      return isPurePaidPayment(payment);
    case 'REJECTED':
      return status === 'REJECTED';
    case 'PENDING':
      return status === 'PENDING';
    case 'REFUNDED':
      return isRefundRelatedPayment(payment);
    case 'CANCELLED':
      return status === 'CANCELLED';
    default:
      return true;
  }
}

export function paymentsInTenantSection(
  payments: SpacePaymentResponse[],
  section: TenantPaymentsSection,
): SpacePaymentResponse[] {
  return payments.filter(payment => {
    const status = payment.paymentStatus;
    switch (section) {
      case 'actionNeeded':
        return (
          status === 'UPDATE_REQUESTED' ||
          status === 'PENDING' ||
          status === 'REJECTED'
        );
      case 'underReview':
        return UNDER_REVIEW.has(status);
      case 'history':
        return HISTORY_STATUSES.has(status);
      default:
        return false;
    }
  });
}

export function countTenantPaymentSection(
  payments: SpacePaymentResponse[],
  section: TenantPaymentsSection,
): number {
  return paymentsInTenantSection(payments, section).length;
}

const TENANT_PAYMENT_SECTION_ORDER: TenantPaymentsSection[] = [
  'actionNeeded',
  'underReview',
  'history',
];

/** Prefer the first section that has items (Action needed → Under review → History). */
export function resolvePreferredTenantPaymentsSection(
  payments: SpacePaymentResponse[],
  current: TenantPaymentsSection = 'actionNeeded',
): TenantPaymentsSection {
  if (countTenantPaymentSection(payments, current) > 0) {
    return current;
  }
  for (const section of TENANT_PAYMENT_SECTION_ORDER) {
    if (countTenantPaymentSection(payments, section) > 0) {
      return section;
    }
  }
  return current;
}

export function filterTenantPayments(
  payments: SpacePaymentResponse[],
  filter: TenantPaymentFilter,
): SpacePaymentResponse[] {
  return payments.filter(payment => matchesTenantPaymentFilter(payment, filter));
}

export function filterTenantPaymentsInSection(
  payments: SpacePaymentResponse[],
  section: TenantPaymentsSection,
  filter: TenantPaymentFilter,
): SpacePaymentResponse[] {
  const inSection = paymentsInTenantSection(payments, section);
  if (filter === 'ALL') {
    return inSection;
  }
  return filterTenantPayments(inSection, filter);
}

export function countTenantPaymentFilter(
  payments: SpacePaymentResponse[],
  filter: TenantPaymentFilter,
): number {
  return filterTenantPayments(payments, filter).length;
}

export function countTenantPaymentFilterInSection(
  payments: SpacePaymentResponse[],
  section: TenantPaymentsSection,
  filter: TenantPaymentFilter,
): number {
  return filterTenantPaymentsInSection(payments, section, filter).length;
}
