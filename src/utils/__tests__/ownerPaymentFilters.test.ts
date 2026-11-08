import { computeOwnerPaymentCounts, filterReviewPayments } from '../ownerPaymentFilters';
import type { MemberPaymentLedgerRow, SpacePaymentResponse } from '../../api/types';

function payment(
  overrides: Partial<SpacePaymentResponse> & Pick<SpacePaymentResponse, 'paymentStatus'>,
): SpacePaymentResponse {
  return {
    paymentId: 'p1',
    spaceId: 's1',
    memberId: 'm1',
    memberName: 'A',
    paymentType: 'MEAL',
    paymentCategory: 'DAILY',
    title: 'Meals',
    amount: 100,
    currencyCode: 'INR',
    month: '2026-07',
    ...overrides,
  } as SpacePaymentResponse;
}

describe('ownerPaymentFilters', () => {
  it('counts under-review separately from pending members', () => {
    const payments = [
      payment({ paymentStatus: 'UNDER_REVIEW' }),
      payment({ paymentId: 'p2', paymentStatus: 'UPDATE_REQUESTED' }),
      payment({ paymentId: 'p3', paymentStatus: 'PAID' }),
    ];
    const members: MemberPaymentLedgerRow[] = [
      {
        memberId: 'm1',
        memberName: 'A',
        expectedCharges: 300,
        collected: null,
        pending: 100,
        underReview: 100,
        currencyCode: 'INR',
        status: 'PENDING',
      },
      {
        memberId: 'm2',
        memberName: 'B',
        expectedCharges: 100,
        collected: 100,
        pending: 0,
        currencyCode: 'INR',
        status: 'PAID',
      },
    ];

    const counts = computeOwnerPaymentCounts(payments, members);
    expect(counts.submitted).toBe(1);
    expect(counts.changesRequested).toBe(1);
    expect(counts.pendingReview).toBe(2);
    expect(counts.paid).toBe(1);
    expect(counts.pendingMembers).toBe(1);
  });

  it('filters pending review chips without network', () => {
    const payments = [
      payment({ paymentStatus: 'UNDER_REVIEW' }),
      payment({ paymentId: 'p2', paymentStatus: 'UPDATE_REQUESTED' }),
    ];
    expect(filterReviewPayments(payments, 'PENDING', 'SUBMITTED', 'PAID')).toHaveLength(1);
    expect(filterReviewPayments(payments, 'PENDING', 'NEEDS_UPDATE', 'PAID')).toHaveLength(1);
  });

  it('counts and filters refunded and cancelled history queues', () => {
    const payments = [
      payment({ paymentStatus: 'PAID' }),
      payment({ paymentId: 'p2', paymentStatus: 'REFUNDED' }),
      payment({ paymentId: 'p3', paymentStatus: 'CANCELLED' }),
      payment({ paymentId: 'p4', paymentStatus: 'REJECTED' }),
      payment({
        paymentId: 'p5',
        paymentStatus: 'PAID',
        partiallyRefunded: true,
        refundedAmount: 1000,
        retainedAmount: 4500,
      }),
    ];
    const counts = computeOwnerPaymentCounts(payments, []);
    expect(counts.paid).toBe(1);
    expect(counts.refunded).toBe(2);
    expect(counts.cancelled).toBe(1);
    expect(counts.history).toBe(5);
    expect(filterReviewPayments(payments, 'HISTORY', 'SUBMITTED', 'REFUNDED')).toHaveLength(2);
    expect(filterReviewPayments(payments, 'HISTORY', 'SUBMITTED', 'CANCELLED')).toHaveLength(1);
    expect(filterReviewPayments(payments, 'HISTORY', 'SUBMITTED', 'PAID')).toHaveLength(1);
  });
});
