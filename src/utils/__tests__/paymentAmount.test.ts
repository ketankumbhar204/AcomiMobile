import { formatPaymentAmount } from '../paymentAmount';

describe('formatPaymentAmount', () => {
  it('formats Indian rupees, including zero, and leaves an unknown amount empty', () => {
    expect(formatPaymentAmount(500)).toBe('₹500');
    expect(formatPaymentAmount(6000)).toBe('₹6,000');
    expect(formatPaymentAmount(125000)).toBe('₹1,25,000');
    expect(formatPaymentAmount(0)).toBe('₹0');
    expect(formatPaymentAmount(null)).toBeNull();
    expect(formatPaymentAmount(4258.06)).toBe('₹4,258');
    expect(formatPaymentAmount(20258.5)).toBe('₹20,259');
  });
});
