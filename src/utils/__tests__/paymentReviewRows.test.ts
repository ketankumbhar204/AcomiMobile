import type { SpacePaymentResponse } from '../../api/types';
import { applyPaymentToReviewRows, paymentAfterReview } from '../paymentReviewRows';

function payment(
  patch: Partial<SpacePaymentResponse> & Pick<SpacePaymentResponse, 'paymentId' | 'paymentStatus'>,
): SpacePaymentResponse {
  return {
    spaceId: 'space',
    memberId: 'member',
    memberName: 'Rahul',
    paymentType: 'RENT',
    paymentCategory: 'MONTHLY',
    title: 'Rent',
    amount: 6000,
    currencyCode: 'INR',
    dueDate: '2026-10-01',
    month: '2026-10',
    createdAt: '',
    updatedAt: '',
    ...patch,
  } as SpacePaymentResponse;
}

describe('applyPaymentToReviewRows', () => {
  it('removes an approved payment from the submitted queue and shows Paid in history', () => {
    const submitted = [payment({ paymentId: 'rent', paymentStatus: 'UNDER_REVIEW' })];
    const approved = payment({ paymentId: 'rent', paymentStatus: 'PAID', paidAmount: 6000, outstandingAmount: 0 });

    expect(applyPaymentToReviewRows(submitted, approved, 'SUBMITTED')).toEqual({
      rows: [],
      removed: true,
    });
    expect(applyPaymentToReviewRows([], approved, 'PAID').rows.map(row => row.paymentStatus)).toEqual([
      'PAID',
    ]);
  });

  it('moves needs-update and rejected payments to their queues', () => {
    const submitted = [payment({ paymentId: 'rent', paymentStatus: 'UNDER_REVIEW' })];
    const needsUpdate = payment({ paymentId: 'rent', paymentStatus: 'UPDATE_REQUESTED' });
    const rejected = payment({ paymentId: 'rent', paymentStatus: 'REJECTED' });

    expect(applyPaymentToReviewRows(submitted, needsUpdate, 'SUBMITTED').removed).toBe(true);
    expect(applyPaymentToReviewRows([], needsUpdate, 'NEEDS_UPDATE').rows).toHaveLength(1);
    expect(applyPaymentToReviewRows(submitted, rejected, 'REJECTED').rows[0]?.paymentStatus).toBe(
      'REJECTED',
    );
  });

  it('keeps Paid when the review response is still Under review', () => {
    const stale = payment({ paymentId: 'rent', paymentStatus: 'UNDER_REVIEW' });
    expect(paymentAfterReview(stale, 'APPROVE').paymentStatus).toBe('PAID');
    expect(paymentAfterReview(stale, 'REJECT').paymentStatus).toBe('REJECTED');
    expect(paymentAfterReview(stale, 'REQUEST_UPDATE').paymentStatus).toBe('UPDATE_REQUESTED');
    expect(
      paymentAfterReview(payment({ paymentId: 'rent', paymentStatus: 'PAID' }), 'APPROVE')
        .paymentStatus,
    ).toBe('PAID');
  });

  it('does not report a second removal after the payment has already left the queue', () => {
    const approved = payment({ paymentId: 'rent', paymentStatus: 'PAID' });
    expect(applyPaymentToReviewRows([], approved, 'SUBMITTED').removed).toBe(false);
  });

  it('replaces an existing row instead of duplicating it', () => {
    const paid = payment({ paymentId: 'rent', paymentStatus: 'PAID', amount: 6000 });
    const refreshed = payment({ paymentId: 'rent', paymentStatus: 'PAID', amount: 6000, paidAmount: 6000 });
    const next = applyPaymentToReviewRows([paid], refreshed, 'PAID');
    expect(next.rows).toHaveLength(1);
    expect(next.rows[0]?.paidAmount).toBe(6000);
    expect(next.removed).toBe(false);
  });
});
