import { resolvePaymentReminderToastKind } from '../paymentReminderFeedback';
import type { PaymentReminderDeliveryResult } from '../../api/paymentsApi';

function result(
  partial: Partial<PaymentReminderDeliveryResult>,
): PaymentReminderDeliveryResult {
  return {
    deliveryId: 'd1',
    paymentId: 'p1',
    channel: 'WHATSAPP',
    deliveryStatus: 'SENT',
    providerConfigured: true,
    ...partial,
  };
}

describe('resolvePaymentReminderToastKind', () => {
  it('maps sent, skipped, and provider-missing results', () => {
    expect(resolvePaymentReminderToastKind(result({ deliveryStatus: 'SENT' }))).toBe('sent');
    expect(resolvePaymentReminderToastKind(result({ deliveryStatus: 'SKIPPED' }))).toBe(
      'alreadySentToday',
    );
    expect(
      resolvePaymentReminderToastKind(
        result({ deliveryStatus: 'FAILED', providerConfigured: false }),
      ),
    ).toBe('providerUnavailable');
  });
});
