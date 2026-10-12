import { reminderWhatsAppTarget } from '../paymentReminderLaunch';

describe('payment reminder launch', () => {
  it('uses the server WhatsApp link and does not invent a send', () => {
    const target = reminderWhatsAppTarget({
      messageText: 'Hi Rahul Kumar, pending Rent',
      whatsAppUrl: 'https://wa.me/919999999991?text=Hi%20Rahul%20Kumar',
      internationalPhone: '919999999991',
    });
    expect(target.url).toBe('https://wa.me/919999999991?text=Hi%20Rahul%20Kumar');
    expect(target.message).toContain('Rahul Kumar');
  });

  it('builds an encoded link from the phone when the server omits the url', () => {
    const target = reminderWhatsAppTarget({
      messageText: 'Hi Rahul, rent is due',
      internationalPhone: '9999999991',
    });
    expect(target.url).toBe(
      'https://wa.me/919999999991?text=Hi%20Rahul%2C%20rent%20is%20due',
    );
  });

  it('returns no link for a missing number and keeps the message for copy', () => {
    const target = reminderWhatsAppTarget({
      messageText: 'Hi Rahul, rent is due',
      whatsAppUrl: null,
      internationalPhone: '123',
    });
    expect(target.url).toBeNull();
    expect(target.message).toBe('Hi Rahul, rent is due');
  });
});
