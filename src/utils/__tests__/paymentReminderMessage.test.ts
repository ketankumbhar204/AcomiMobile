import { buildPaymentReminderMessage } from '../paymentReminderMessage';

describe('buildPaymentReminderMessage', () => {
  it('includes the member, amount, description, period, and due date', () => {
    const message = buildPaymentReminderMessage({
      memberName: 'Rahul Kumar',
      amount: 1000,
      outstandingAmount: 1000,
      currencyCode: 'INR',
      title: 'Electricity',
      paymentType: 'OTHER',
      dueDate: '2026-10-17',
      month: '2026-10',
    });

    expect(message).toContain('Hi Rahul Kumar');
    expect(message).toContain('₹1,000');
    expect(message).toContain('Electricity');
    expect(message).toContain('October 2026');
    expect(message).toContain('due on');
    expect(message).toContain('Thank you.');
  });

  it('omits a due date that is not available', () => {
    const message = buildPaymentReminderMessage({
      memberName: 'Rahul Kumar',
      amount: 500,
      title: 'Rent',
    });
    expect(message).not.toContain('due on');
  });
});
