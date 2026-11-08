import { paymentTimelineAmountInfo } from '../paymentTimelineAmount';

describe('paymentTimelineAmountInfo', () => {
  it('parses refunded amount from settlement remarks', () => {
    expect(
      paymentTimelineAmountInfo({
        eventType: 'REFUNDED',
        remarks: 'Refunded 1200 — Move-out adjustment',
      }),
    ).toEqual({ amount: 1200, note: 'Move-out adjustment' });
  });

  it('parses retained amount from settlement remarks', () => {
    expect(
      paymentTimelineAmountInfo({
        eventType: 'RETAINED',
        remarks: 'Retained 3300',
      }),
    ).toEqual({ amount: 3300, note: null });
  });

  it('falls back to payment amount for paid/created events', () => {
    expect(
      paymentTimelineAmountInfo(
        { eventType: 'PAID', remarks: null },
        5500,
      ),
    ).toEqual({ amount: 5500, note: null });
  });
});
