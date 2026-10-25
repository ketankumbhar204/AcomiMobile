import type { SpacePaymentResponse } from '../../api/types';
import {
  buildPaymentDetailPresentation,
  paymentDetailPlaceLine,
} from '../paymentDetailPresentation';

const t = (key: string, options?: Record<string, unknown>) => {
  if (key === 'paymentCollection.detail.mealDaysCount') {
    return `${options?.count} days`;
  }
  if (key === 'paymentCollection.detail.fields.proratedDays') {
    return `${options?.days} of ${options?.total} days`;
  }
  return key;
};

function rent(overrides: Partial<SpacePaymentResponse> = {}): SpacePaymentResponse {
  return {
    paymentId: 'pay-oct',
    spaceId: 'space-1',
    memberId: 'member-1',
    memberName: 'Rahul Kumar',
    memberMobile: '9999999991',
    paymentType: 'RENT',
    paymentCategory: 'MONTHLY',
    title: 'Rent - October 2026',
    amount: 6000,
    currencyCode: 'INR',
    dueDate: '2026-10-01',
    month: '2026-10',
    paymentStatus: 'PENDING',
    targetLabel: 'Unit 101 · Room A',
    createdAt: '2026-10-03T14:35:00.000Z',
    updatedAt: '2026-10-03T14:35:00.000Z',
    billingPeriodStart: '2026-10-01',
    billingPeriodEnd: '2026-10-31',
    baseAmount: 6000,
    paidAmount: 0,
    outstandingAmount: 6000,
    isOverdue: true,
    daysOverdue: 16,
    ...overrides,
  } as SpacePaymentResponse;
}

describe('buildPaymentDetailPresentation', () => {
  it('summarizes one rent obligation once from the backend amounts', () => {
    const summary = buildPaymentDetailPresentation(rent(), t, {
      locale: 'en',
      spaceName: 'Sunrise PG',
    });

    expect(summary.paymentId).toBe('pay-oct');
    expect(summary.tenantName).toBe('Rahul Kumar');
    expect(summary.tenantInitial).toBe('R');
    expect(summary.tenantMobile).toBe('9999999991');
    expect(summary.tenantPlace).toBe('Sunrise PG · Unit 101 · Room A');
    expect(summary.title).toBe('Rent - October 2026');
    expect(summary.status).toBe('OVERDUE');
    expect(summary.amountLabel).toBe('₹6,000');
    expect(summary.dueDateLabel).toBe('1 Oct 2026');
    expect(summary.billingPeriodLabel).toBe('1 Oct 2026 – 31 Oct 2026');
    expect(summary.overdue).toEqual({ days: 16, outstandingLabel: '₹6,000' });
    expect(summary.figures.map(figure => [figure.key, figure.value, figure.tone])).toEqual([
      ['base', '₹6,000', 'default'],
      ['paid', '₹0', 'positive'],
      ['outstanding', '₹6,000', 'danger'],
    ]);
    expect(summary.additional.map(row => row.key)).toEqual(['location', 'type', 'category']);
    expect(summary.additional.map(row => row.key)).not.toEqual(
      expect.arrayContaining(['due', 'billingPeriod', 'baseAmount', 'paid', 'outstanding', 'overdue']),
    );
  });

  it('keeps a different obligation even when the title and amount match', () => {
    const october = buildPaymentDetailPresentation(rent(), t, { locale: 'en' });
    const copy = buildPaymentDetailPresentation(
      rent({
        paymentId: 'pay-nov',
        month: '2026-11',
        title: 'Rent - October 2026',
        dueDate: '2026-11-01',
        billingPeriodStart: '2026-11-01',
        billingPeriodEnd: '2026-11-30',
      }),
      t,
      { locale: 'en' },
    );

    expect(october.paymentId).not.toBe(copy.paymentId);
    expect(copy.amountLabel).toBe(october.amountLabel);
    expect(copy.billingPeriodLabel).toBe('1 Nov 2026 – 30 Nov 2026');
  });

  it('uses the backend outstanding amount instead of subtracting paid from the total', () => {
    const summary = buildPaymentDetailPresentation(
      rent({
        amount: 6000,
        paidAmount: 1000,
        outstandingAmount: 1500,
        isOverdue: false,
        paymentStatus: 'PENDING',
      }),
      t,
      { locale: 'en' },
    );

    expect(summary.status).toBe('PENDING');
    expect(summary.overdue).toBeNull();
    expect(summary.figures.find(figure => figure.key === 'outstanding')?.value).toBe('₹1,500');
    expect(summary.figures.find(figure => figure.key === 'paid')?.value).toBe('₹1,000');
  });

  it('keeps a submitted proof under review instead of overdue', () => {
    const summary = buildPaymentDetailPresentation(
      rent({
        paymentStatus: 'UNDER_REVIEW',
        isOverdue: true,
        daysOverdue: 17,
        paymentReference: 'PAY-20261017-000001',
      }),
      t,
      { locale: 'en' },
    );

    expect(summary.status).toBe('UNDER_REVIEW');
    expect(summary.overdue).toBeNull();
  });

  it('keeps a settled payment out of the overdue treatment', () => {
    const summary = buildPaymentDetailPresentation(
      rent({
        paymentStatus: 'PAID',
        isOverdue: true,
        daysOverdue: 4,
        paidAmount: 6000,
        outstandingAmount: 0,
        paymentMethod: 'UPI',
        referenceNumber: 'UTR123',
        paymentReference: 'PAY-20261003-000123',
        paymentDate: '2026-10-02',
      }),
      t,
      { locale: 'en' },
    );

    expect(summary.status).toBe('PAID');
    expect(summary.overdue).toBeNull();
    expect(summary.figures.find(figure => figure.key === 'outstanding')?.tone).toBe('positive');
    expect(summary.additional.map(row => row.key)).toEqual(
      expect.arrayContaining(['paidOn', 'submitted', 'method', 'paymentReference', 'utr']),
    );
  });

  it('leaves outstanding blank when the backend did not send it', () => {
    const summary = buildPaymentDetailPresentation(
      rent({ outstandingAmount: null, paidAmount: null, isOverdue: true, daysOverdue: 2 }),
      t,
      { locale: 'en' },
    );

    expect(summary.figures.find(figure => figure.key === 'outstanding')).toBeUndefined();
    expect(summary.figures.find(figure => figure.key === 'paid')).toBeUndefined();
    expect(summary.overdue).toEqual({ days: 2, outstandingLabel: null });
  });

  it('falls back to the month name when the billing range is missing', () => {
    const summary = buildPaymentDetailPresentation(
      rent({ billingPeriodStart: null, billingPeriodEnd: null, title: 'Rent' }),
      t,
      { locale: 'en-GB' },
    );

    expect(summary.billingPeriodLabel).toMatch(/October 2026/);
    expect(summary.title).toBe('Rent – October 2026');
  });

  it('does not append a second period when the title already names the year', () => {
    const summary = buildPaymentDetailPresentation(rent({ title: 'Rent - October 2026' }), t, {
      locale: 'hi',
    });
    expect(summary.title).toBe('Rent - October 2026');
  });
});

describe('paymentDetailPlaceLine', () => {
  it('joins the property and stay once', () => {
    expect(paymentDetailPlaceLine('Sunrise PG', 'Unit 101 • Room A')).toBe(
      'Sunrise PG · Unit 101 · Room A',
    );
    expect(paymentDetailPlaceLine('Sunrise PG', 'Sunrise PG · Unit 101 · Room A')).toBe(
      'Sunrise PG · Unit 101 · Room A',
    );
  });
});
