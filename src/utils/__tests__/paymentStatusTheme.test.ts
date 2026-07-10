import {
  getPaymentStatusLabelKey,
  resolvePaymentStatusVariant,
  resolveTimelineEventVariant,
} from '../paymentStatusTheme';

describe('paymentStatusTheme', () => {
  it('maps payment statuses to consistent variants', () => {
    expect(resolvePaymentStatusVariant('PENDING')).toBe('pending');
    expect(resolvePaymentStatusVariant('PARTIAL')).toBe('partial');
    expect(resolvePaymentStatusVariant('UNDER_REVIEW')).toBe('underReview');
    expect(resolvePaymentStatusVariant('PROOF_UPLOADED')).toBe('underReview');
    expect(resolvePaymentStatusVariant('UPDATE_REQUESTED')).toBe('needsUpdate');
    expect(resolvePaymentStatusVariant('PAID')).toBe('paid');
    expect(resolvePaymentStatusVariant('REJECTED')).toBe('rejected');
    expect(resolvePaymentStatusVariant('NONE')).toBe('neutral');
  });

  it('uses submitted label for proof uploaded', () => {
    expect(getPaymentStatusLabelKey('PROOF_UPLOADED')).toBe('payments.status.submitted');
    expect(getPaymentStatusLabelKey('UNDER_REVIEW')).toBe('payments.status.underReview');
  });

  it('maps timeline events to status colors', () => {
    expect(resolveTimelineEventVariant('CREATED')).toBe('pending');
    expect(resolveTimelineEventVariant('PROOF_UPLOADED')).toBe('underReview');
    expect(resolveTimelineEventVariant('UPDATE_REQUESTED')).toBe('needsUpdate');
    expect(resolveTimelineEventVariant('PAID')).toBe('paid');
    expect(resolveTimelineEventVariant('REJECTED')).toBe('rejected');
    expect(resolveTimelineEventVariant('REFUNDED')).toBe('neutral');
  });
});
