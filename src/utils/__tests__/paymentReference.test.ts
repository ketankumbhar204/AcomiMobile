import { resolvePaymentReferenceDisplay } from '../paymentReference';

describe('resolvePaymentReferenceDisplay', () => {
  it('prefers paymentReference over batch id', () => {
    expect(
      resolvePaymentReferenceDisplay({
        paymentReference: 'PAY-20260720-000123',
        paymentBatchId: 'MP-20260719-77F2D9',
      }),
    ).toBe('PAY-20260720-000123');
  });

  it('falls back to human batch codes', () => {
    expect(
      resolvePaymentReferenceDisplay({
        paymentReference: null,
        paymentBatchId: 'MP-20260719-77F2D9',
      }),
    ).toBe('MP-20260719-77F2D9');
  });

  it('hides UUID-like ids', () => {
    expect(
      resolvePaymentReferenceDisplay({
        paymentBatchId: '2cec6d94-0253-478c-a9f1-345672c676fd',
      }),
    ).toBeNull();
  });
});
