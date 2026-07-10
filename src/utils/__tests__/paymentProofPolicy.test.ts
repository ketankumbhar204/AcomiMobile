import type { SpacePaymentResponse } from '../../api/types';
import {
  buildDefaultPaymentRemark,
  DEFAULT_PAYMENT_PROOF_REQUIREMENTS,
  formatBillingPeriod,
  resolvePaymentProofRequirements,
  validatePaymentProofSubmission,
} from '../paymentProofPolicy';

const t = ((key: string, params?: Record<string, string>) => {
  if (params) {
    return `${key}:${JSON.stringify(params)}`;
  }
  return key;
}) as never;

function payment(overrides: Partial<SpacePaymentResponse> = {}): SpacePaymentResponse {
  return {
    paymentId: 'p1',
    spaceId: 's1',
    memberId: 'm1',
    memberName: 'Tenant',
    paymentType: 'RENT',
    paymentCategory: 'MONTHLY',
    title: 'Rent — July 2026',
    amount: 10000,
    currencyCode: 'INR',
    dueDate: '2026-07-10',
    month: '2026-07',
    paymentStatus: 'PENDING',
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
    ...overrides,
  };
}

describe('paymentProofPolicy', () => {
  it('defaults proof requirements to optional', () => {
    expect(resolvePaymentProofRequirements()).toEqual(DEFAULT_PAYMENT_PROOF_REQUIREMENTS);
  });

  it('allows submission without screenshot or UTR by default', () => {
    expect(
      validatePaymentProofSubmission({ remarks: 'Paid today' }, DEFAULT_PAYMENT_PROOF_REQUIREMENTS),
    ).toBeNull();
  });

  it('enforces screenshot when configured', () => {
    expect(
      validatePaymentProofSubmission(
        { remarks: 'Paid today' },
        { screenshotRequired: true, utrRequired: false },
      ),
    ).toBe('screenshotRequired');
  });

  it('enforces UTR when configured', () => {
    expect(
      validatePaymentProofSubmission(
        { proofImageBase64: 'data:image/png;base64,abc' },
        { screenshotRequired: false, utrRequired: true },
      ),
    ).toBe('utrRequired');
  });

  it('formats billing period from month', () => {
    expect(formatBillingPeriod('2026-07', 'en-IN')).toMatch(/July.*2026/);
  });

  it('builds rent remark with payment method', () => {
    const remark = buildDefaultPaymentRemark(
      payment(),
      t,
      'en-IN',
      new Date('2026-07-09'),
      'CASH',
    );
    expect(remark).toContain('paymentCollection.proof.defaultRemark.rent');
    expect(remark).toContain('₹10,000');
    expect(remark).toContain('July 2026');
    expect(remark).toContain('CASH');
  });

  it('builds meal remark from title with payment method', () => {
    const remark = buildDefaultPaymentRemark(
      payment({ paymentType: 'MEAL', title: 'Dinner — July 2026', amount: 60 }),
      t,
      'en-IN',
      new Date('2026-07-15'),
      'UPI',
    );
    expect(remark).toContain('paymentCollection.proof.defaultRemark.meal');
    expect(remark).toContain('Dinner');
    expect(remark).toContain('UPI');
  });

  it('builds deposit remark with payment method', () => {
    const remark = buildDefaultPaymentRemark(
      payment({ paymentType: 'DEPOSIT', paymentCategory: 'SECURITY', amount: 5000 }),
      t,
      'en-IN',
      new Date('2026-07-09'),
      'CASH',
    );
    expect(remark).toContain('paymentCollection.proof.defaultRemark.deposit');
    expect(remark).toContain('CASH');
  });
});
