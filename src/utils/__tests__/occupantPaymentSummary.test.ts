import {
  bedCardBalanceFace,
  selectStayCharges,
  summarizeStayCharges,
  type StayPaymentInput,
} from '../occupantPaymentSummary';

const stay = 'occ-current';
const month = '2026-10';

function row(patch: StayPaymentInput): StayPaymentInput {
  return { occupancyId: stay, month, ...patch };
}

describe('occupant payment summary', () => {
  it('does not treat configured rent as a due when there is no payment record', () => {
    const summary = summarizeStayCharges([], month);
    expect(summary.status).toBe('NO_RECORD');
    expect(summary.outstanding).toBeNull();
    expect(summary.rent).toBeNull();
    expect(summary.deposit).toBeNull();
  });

  it('shows the outstanding balance for an unpaid rent record', () => {
    const summary = summarizeStayCharges(
      [
        row({
          paymentType: 'RENT',
          paymentStatus: 'PENDING',
          settlementStatus: 'UNPAID',
          amount: 6000,
          paidAmount: 0,
          outstandingAmount: 6000,
        }),
      ],
      month,
    );
    expect(summary.status).toBe('PENDING');
    expect(summary.outstanding).toBe(6000);
    expect(summary.rent?.outstanding).toBe(6000);
  });

  it('shows the remaining balance for a partial payment', () => {
    const summary = summarizeStayCharges(
      [
        row({
          paymentType: 'RENT',
          paymentStatus: 'PENDING',
          settlementStatus: 'PARTIALLY_PAID',
          amount: 6000,
          paidAmount: 2000,
          outstandingAmount: 4000,
        }),
      ],
      month,
    );
    expect(summary.status).toBe('PARTIALLY_PAID');
    expect(summary.amountPaid).toBe(2000);
    expect(summary.outstanding).toBe(4000);
  });

  it('shows paid when the obligation is settled', () => {
    const summary = summarizeStayCharges(
      [
        row({
          paymentType: 'RENT',
          paymentStatus: 'PAID',
          settlementStatus: 'PAID',
          amount: 6000,
          paidAmount: 6000,
          outstandingAmount: 0,
        }),
      ],
      month,
    );
    expect(summary.status).toBe('PAID');
    expect(summary.amountPaid).toBe(6000);
    expect(summary.outstanding).toBe(0);
  });

  it('keeps an unpaid deposit independent of paid rent', () => {
    const summary = summarizeStayCharges(
      [
        row({
          paymentType: 'RENT',
          paymentStatus: 'PAID',
          amount: 6000,
          paidAmount: 6000,
          outstandingAmount: 0,
        }),
        row({
          paymentType: 'DEPOSIT',
          paymentStatus: 'PENDING',
          month: '2026-08',
          amount: 3000,
          paidAmount: 0,
          outstandingAmount: 3000,
        }),
      ],
      month,
    );
    expect(summary.rent?.status).toBe('PAID');
    expect(summary.deposit?.status).toBe('PENDING');
    expect(summary.deposit?.outstanding).toBe(3000);
    expect(summary.status).toBe('PARTIALLY_PAID');
    expect(summary.outstanding).toBe(3000);
  });

  it('does not invent a status when the record has no amounts', () => {
    const summary = summarizeStayCharges(
      [row({ paymentType: 'RENT', paymentStatus: 'PENDING' })],
      month,
    );
    expect(summary.status).toBe('UNAVAILABLE');
    expect(summary.outstanding).toBeNull();
  });

  it('ignores another occupant and another month of rent', () => {
    const selected = selectStayCharges(
      [
        row({
          paymentType: 'RENT',
          paymentStatus: 'PENDING',
          amount: 6000,
          paidAmount: 0,
          outstandingAmount: 6000,
        }),
        row({
          occupancyId: 'occ-previous',
          paymentType: 'RENT',
          paymentStatus: 'PENDING',
          amount: 9000,
          outstandingAmount: 9000,
        }),
        row({
          paymentType: 'RENT',
          month: '2026-09',
          paymentStatus: 'PENDING',
          amount: 6000,
          outstandingAmount: 6000,
        }),
        row({
          paymentType: 'DEPOSIT',
          month: '2026-08',
          paymentStatus: 'PAID',
          amount: 3000,
          paidAmount: 3000,
          outstandingAmount: 0,
        }),
      ],
      stay,
      month,
    );
    const summary = summarizeStayCharges(selected, month);
    expect(summary.outstanding).toBe(6000);
    expect(summary.deposit?.status).toBe('PAID');
    expect(summary.amountPaid).toBe(3000);
  });
});

describe('bed card balance face', () => {
  it('shows the remaining balance once for a partial payment', () => {
    const summary = summarizeStayCharges(
      [
        row({
          paymentType: 'RENT',
          settlementStatus: 'PARTIALLY_PAID',
          amount: 5000,
          paidAmount: 3000,
          outstandingAmount: 2000,
        }),
        row({
          paymentType: 'DEPOSIT',
          settlementStatus: 'UNPAID',
          amount: 5000,
          paidAmount: 0,
          outstandingAmount: 5000,
        }),
      ],
      month,
    );
    const face = bedCardBalanceFace(summary);
    expect(face.kind).toBe('balance');
    if (face.kind !== 'balance') {
      return;
    }
    expect(face.outstanding).toBe(7000);
    expect(face.paid).toBe(3000);
    expect(face.lines).toEqual([
      { kind: 'RENT', amount: 5000 },
      { kind: 'DEPOSIT', amount: 5000 },
    ]);
  });

  it('breaks a pending balance into rent and deposit without adding them again', () => {
    const summary = summarizeStayCharges(
      [
        row({
          paymentType: 'RENT',
          settlementStatus: 'UNPAID',
          amount: 4258.06,
          paidAmount: 0,
          outstandingAmount: 4258.06,
        }),
        row({
          paymentType: 'DEPOSIT',
          settlementStatus: 'UNPAID',
          amount: 3000,
          paidAmount: 0,
          outstandingAmount: 3000,
        }),
      ],
      month,
    );
    const face = bedCardBalanceFace(summary);
    expect(face).toMatchObject({
      kind: 'balance',
      outstanding: 7258.06,
      paid: null,
      lines: [
        { kind: 'RENT', amount: 4258.06 },
        { kind: 'DEPOSIT', amount: 3000 },
      ],
    });
  });

  it('shows a paid stay without a balance due', () => {
    const summary = summarizeStayCharges(
      [
        row({
          paymentType: 'RENT',
          settlementStatus: 'PAID',
          paymentStatus: 'PAID',
          amount: 6000,
          paidAmount: 6000,
          outstandingAmount: 0,
        }),
      ],
      month,
    );
    expect(bedCardBalanceFace(summary)).toEqual({ kind: 'paid', paid: 6000 });
  });

  it('keeps an overdue outstanding balance as the headline', () => {
    const summary = summarizeStayCharges(
      [
        row({
          paymentType: 'RENT',
          paymentStatus: 'PENDING',
          settlementStatus: 'UNPAID',
          amount: 4000,
          paidAmount: 0,
          outstandingAmount: 4000,
        }),
      ],
      month,
    );
    expect(bedCardBalanceFace(summary)).toMatchObject({
      kind: 'balance',
      outstanding: 4000,
      paid: null,
      lines: [{ kind: 'RENT', amount: 4000 }],
    });
  });

  it('does not invent a balance when payment data is missing', () => {
    expect(bedCardBalanceFace(summarizeStayCharges([], month))).toEqual({
      kind: 'note',
      status: 'NO_RECORD',
    });
  });
});
