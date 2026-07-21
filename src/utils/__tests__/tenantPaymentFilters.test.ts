import {
  countTenantPaymentFilter,
  countTenantPaymentSection,
  filterTenantPayments,
  filterTenantPaymentsInSection,
  matchesTenantPaymentFilter,
  paymentsInTenantSection,
  resolvePreferredTenantPaymentsSection,
} from '../tenantPaymentFilters';
import type { SpacePaymentResponse } from '../../api/types';

const sample: SpacePaymentResponse[] = [
  {
    paymentId: '1',
    spaceId: 's',
    memberId: 'm',
    memberName: 'A',
    paymentType: 'RENT',
    paymentCategory: 'MONTHLY',
    title: 'Rent',
    amount: 1000,
    currencyCode: 'INR',
    dueDate: '2026-07-31',
    month: '2026-07',
    paymentStatus: 'UPDATE_REQUESTED',
  } as SpacePaymentResponse,
  {
    paymentId: '2',
    spaceId: 's',
    memberId: 'm',
    memberName: 'A',
    paymentType: 'RENT',
    paymentCategory: 'MONTHLY',
    title: 'Rent 2',
    amount: 1000,
    currencyCode: 'INR',
    dueDate: '2026-07-31',
    month: '2026-07',
    paymentStatus: 'PAID',
  } as SpacePaymentResponse,
  {
    paymentId: '3',
    spaceId: 's',
    memberId: 'm',
    memberName: 'A',
    paymentType: 'RENT',
    paymentCategory: 'MONTHLY',
    title: 'Rent 3',
    amount: 1000,
    currencyCode: 'INR',
    dueDate: '2026-07-31',
    month: '2026-07',
    paymentStatus: 'UNDER_REVIEW',
  } as SpacePaymentResponse,
  {
    paymentId: '4',
    spaceId: 's',
    memberId: 'm',
    memberName: 'A',
    paymentType: 'RENT',
    paymentCategory: 'MONTHLY',
    title: 'Rent 4',
    amount: 1000,
    currencyCode: 'INR',
    dueDate: '2026-07-31',
    month: '2026-07',
    paymentStatus: 'PENDING',
  } as SpacePaymentResponse,
];

describe('tenantPaymentFilters', () => {
  it('matches needs update and under review', () => {
    expect(matchesTenantPaymentFilter('UPDATE_REQUESTED', 'NEEDS_UPDATE')).toBe(true);
    expect(matchesTenantPaymentFilter('PROOF_UPLOADED', 'UNDER_REVIEW')).toBe(true);
    expect(matchesTenantPaymentFilter('UNDER_REVIEW', 'UNDER_REVIEW')).toBe(true);
    expect(matchesTenantPaymentFilter('PAID', 'NEEDS_UPDATE')).toBe(false);
  });

  it('filters and counts lists', () => {
    expect(filterTenantPayments(sample, 'NEEDS_UPDATE')).toHaveLength(1);
    expect(countTenantPaymentFilter(sample, 'ALL')).toBe(4);
    expect(countTenantPaymentFilter(sample, 'PAID')).toBe(1);
  });

  it('groups into action / under review / history sections', () => {
    expect(countTenantPaymentSection(sample, 'actionNeeded')).toBe(2);
    expect(countTenantPaymentSection(sample, 'underReview')).toBe(1);
    expect(countTenantPaymentSection(sample, 'history')).toBe(1);
    expect(paymentsInTenantSection(sample, 'actionNeeded').map(p => p.paymentId)).toEqual([
      '1',
      '4',
    ]);
    expect(filterTenantPaymentsInSection(sample, 'actionNeeded', 'PENDING')).toHaveLength(1);
  });

  it('opens under review when action needed is empty', () => {
    const withoutAction = sample.filter(
      payment =>
        payment.paymentStatus !== 'UPDATE_REQUESTED' &&
        payment.paymentStatus !== 'PENDING' &&
        payment.paymentStatus !== 'REJECTED',
    );
    expect(resolvePreferredTenantPaymentsSection(withoutAction, 'actionNeeded')).toBe(
      'underReview',
    );
  });
});
