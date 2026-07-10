import type { SpacePaymentResponse, UniversalPaymentStatus } from '../api/types';

/** Primary tabs on the tenant Payments screen (mirrors owner Pending Review / History chrome). */
export type TenantPaymentsSection = 'actionNeeded' | 'underReview' | 'history';

export type TenantPaymentFilter =
  | 'ALL'
  | 'NEEDS_UPDATE'
  | 'UNDER_REVIEW'
  | 'PAID'
  | 'REJECTED'
  | 'PENDING';

const UNDER_REVIEW: ReadonlySet<UniversalPaymentStatus> = new Set([
  'UNDER_REVIEW',
  'PROOF_UPLOADED',
]);

export function matchesTenantPaymentFilter(
  status: UniversalPaymentStatus,
  filter: TenantPaymentFilter,
): boolean {
  switch (filter) {
    case 'ALL':
      return true;
    case 'NEEDS_UPDATE':
      return status === 'UPDATE_REQUESTED';
    case 'UNDER_REVIEW':
      return status === 'UNDER_REVIEW' || status === 'PROOF_UPLOADED';
    case 'PAID':
      return status === 'PAID';
    case 'REJECTED':
      return status === 'REJECTED';
    case 'PENDING':
      return status === 'PENDING';
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
        return status === 'PAID';
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

export function filterTenantPayments(
  payments: SpacePaymentResponse[],
  filter: TenantPaymentFilter,
): SpacePaymentResponse[] {
  return payments.filter(payment => matchesTenantPaymentFilter(payment.paymentStatus, filter));
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
