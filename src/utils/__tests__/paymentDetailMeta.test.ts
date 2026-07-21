import { buildPaymentDetailMetaRows } from '../paymentDetailMeta';
import type { SpacePaymentResponse } from '../../api/types';

describe('buildPaymentDetailMetaRows', () => {
  const t = (key: string) => key;

  it('includes type, due, submitted, method, and reference', () => {
    const payment = {
      paymentType: 'MEAL',
      dueDate: '2026-07-10',
      paymentDate: '2026-07-11',
      createdAt: '2026-07-09T10:00:00Z',
      updatedAt: '2026-07-11T12:00:00Z',
      paymentMethod: 'UPI',
      referenceNumber: 'UTR123',
    } as SpacePaymentResponse;

    const rows = buildPaymentDetailMetaRows(payment, t, {
      billingPeriodLabel: 'July 2026',
      mealDaysCount: 2,
    });
    expect(rows.map(row => row.key)).toEqual([
      'type',
      'billingPeriod',
      'mealDays',
      'due',
      'paidOn',
      'submitted',
      'method',
      'utr',
    ]);
    expect(rows.find(row => row.key === 'utr')?.value).toBe('UTR123');
    expect(rows.find(row => row.key === 'billingPeriod')?.value).toBe('July 2026');
  });
});
