import {
  displayPaymentStatus,
  isChangesRequested,
  isOwnerReviewActionable,
  isPaymentActionable,
  isPaymentProofEditable,
  isSubmittedForReview,
  showsPaymentOverdueCue,
} from '../paymentStatus';

describe('paymentStatus', () => {
  it('marks under review payments as editable', () => {
    expect(isPaymentProofEditable('UNDER_REVIEW')).toBe(true);
    expect(isPaymentProofEditable('PROOF_UPLOADED')).toBe(true);
  });

  it('locks proof editing after owner action', () => {
    expect(isPaymentProofEditable('PAID')).toBe(false);
    expect(isPaymentProofEditable('REJECTED')).toBe(false);
    expect(isPaymentProofEditable('PENDING')).toBe(false);
    expect(isPaymentProofEditable('UPDATE_REQUESTED')).toBe(false);
  });

  it('keeps actionable statuses for first-time submission and update requests', () => {
    expect(isPaymentActionable('PENDING')).toBe(true);
    expect(isPaymentActionable('REJECTED')).toBe(true);
    expect(isPaymentActionable('UPDATE_REQUESTED')).toBe(true);
    expect(isPaymentActionable('UNDER_REVIEW')).toBe(false);
  });

  it('groups submitted review statuses', () => {
    expect(isSubmittedForReview('UNDER_REVIEW')).toBe(true);
    expect(isSubmittedForReview('PROOF_UPLOADED')).toBe(true);
    expect(isSubmittedForReview('UPDATE_REQUESTED')).toBe(false);
    expect(isSubmittedForReview('PENDING')).toBe(false);
  });

  it('identifies changes requested queue', () => {
    expect(isChangesRequested('UPDATE_REQUESTED')).toBe(true);
    expect(isChangesRequested('REJECTED')).toBe(false);
  });

  it('keeps a submitted proof as under review even when the due date has passed', () => {
    const submitted = { paymentStatus: 'UNDER_REVIEW' as const, isOverdue: true };
    expect(displayPaymentStatus(submitted)).toBe('UNDER_REVIEW');
    expect(showsPaymentOverdueCue(submitted)).toBe(false);
    expect(displayPaymentStatus({ paymentStatus: 'PROOF_UPLOADED', isOverdue: true })).toBe(
      'PROOF_UPLOADED',
    );
  });

  it('still shows overdue for a customer-action charge', () => {
    const overdue = { paymentStatus: 'PENDING' as const, isOverdue: true };
    expect(displayPaymentStatus(overdue)).toBe('OVERDUE');
    expect(showsPaymentOverdueCue(overdue)).toBe(true);
    expect(displayPaymentStatus({ paymentStatus: 'PAID', isOverdue: true })).toBe('PAID');
    expect(showsPaymentOverdueCue({ paymentStatus: 'PAID', isOverdue: true })).toBe(false);
  });

  it('allows owner review actions before resubmission', () => {
    expect(isOwnerReviewActionable('UNDER_REVIEW')).toBe(true);
    expect(isOwnerReviewActionable('UPDATE_REQUESTED')).toBe(true);
    expect(isOwnerReviewActionable('REJECTED')).toBe(true);
    expect(isOwnerReviewActionable('PAID')).toBe(false);
    expect(isOwnerReviewActionable('PENDING')).toBe(false);
  });
});
