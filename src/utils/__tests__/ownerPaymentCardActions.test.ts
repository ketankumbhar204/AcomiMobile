import {
  canOwnerMarkPaymentReceived,
  canOwnerSendPaymentReminder,
  memberRowShowsOwnerPaymentActions,
  memberRowShowsReceived,
  memberRowShowsReminder,
  receivablePayments,
  reminderEligiblePayments,
} from '../ownerPaymentCardActions';
import type { SpacePaymentResponse } from '../../api/types';

function payment(partial: Partial<SpacePaymentResponse>): SpacePaymentResponse {
  return {
    paymentId: 'p1',
    spaceId: 's1',
    memberId: 'm1',
    memberName: 'Rahul',
    title: 'Rent',
    amount: 3400,
    currencyCode: 'INR',
    paymentStatus: 'PENDING',
    paymentType: 'RENT',
    ...partial,
  } as SpacePaymentResponse;
}

describe('ownerPaymentCardActions', () => {
  it('allows Received for pending and under-review', () => {
    expect(canOwnerMarkPaymentReceived('PENDING')).toBe(true);
    expect(canOwnerMarkPaymentReceived('UNDER_REVIEW')).toBe(true);
    expect(canOwnerMarkPaymentReceived('PROOF_UPLOADED')).toBe(true);
  });

  it('hides Received for paid and terminal statuses', () => {
    expect(canOwnerMarkPaymentReceived('PAID')).toBe(false);
    expect(canOwnerMarkPaymentReceived('REJECTED')).toBe(false);
    expect(canOwnerMarkPaymentReceived('UPDATE_REQUESTED')).toBe(false);
  });

  it('shows reminder only when the backend marks the payment eligible', () => {
    expect(canOwnerSendPaymentReminder(true)).toBe(true);
    expect(canOwnerSendPaymentReminder(false)).toBe(false);
    expect(canOwnerSendPaymentReminder(undefined)).toBe(false);
    expect(
      canOwnerSendPaymentReminder({ paymentStatus: 'PENDING', reminderEligible: false }),
    ).toBe(false);
    expect(
      canOwnerSendPaymentReminder({ paymentStatus: 'PENDING', reminderEligible: null }),
    ).toBe(false);
    expect(
      canOwnerSendPaymentReminder({ paymentStatus: 'PENDING', reminderEligible: true }),
    ).toBe(true);
    expect(
      canOwnerSendPaymentReminder({ paymentStatus: 'PAID', reminderEligible: false }),
    ).toBe(false);
    expect(
      canOwnerSendPaymentReminder({ paymentStatus: 'UNDER_REVIEW', reminderEligible: false }),
    ).toBe(false);
  });

  it('matches owner/manager card action matrix', () => {
    expect(memberRowShowsReceived('PENDING')).toBe(true);
    expect(memberRowShowsReminder('PENDING')).toBe(true);

    expect(memberRowShowsReceived('UNDER_REVIEW')).toBe(true);
    expect(memberRowShowsReminder('UNDER_REVIEW')).toBe(false);

    expect(memberRowShowsReceived('PAID')).toBe(false);
    expect(memberRowShowsReminder('PAID')).toBe(false);

    expect(memberRowShowsReceived('REJECTED')).toBe(false);
    expect(memberRowShowsReminder('REJECTED')).toBe(true);
    expect(memberRowShowsReceived('UPDATE_REQUESTED')).toBe(false);
    expect(memberRowShowsReminder('UPDATE_REQUESTED')).toBe(true);

    expect(memberRowShowsOwnerPaymentActions('PAID')).toBe(false);
  });

  it('filters receivable and reminder-eligible payments', () => {
    const rows = [
      payment({ paymentId: 'a', paymentStatus: 'PENDING', reminderEligible: true }),
      payment({ paymentId: 'b', paymentStatus: 'UNDER_REVIEW', reminderEligible: false }),
      payment({ paymentId: 'c', paymentStatus: 'PAID', reminderEligible: false }),
      payment({ paymentId: 'd', paymentStatus: 'PENDING', reminderEligible: false }),
    ];
    expect(receivablePayments(rows).map(row => row.paymentId)).toEqual(['a', 'b', 'd']);
    expect(reminderEligiblePayments(rows).map(row => row.paymentId)).toEqual(['a']);
  });
});
