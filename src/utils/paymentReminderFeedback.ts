import type { PaymentReminderDeliveryResult } from '../api/paymentsApi';

export type ReminderToastKind =
  | 'sent'
  | 'alreadySentToday'
  | 'providerUnavailable'
  | 'invalidRecipient'
  | 'failed';

export function resolvePaymentReminderToastKind(
  result: PaymentReminderDeliveryResult,
): ReminderToastKind {
  const code = `${result.failureCode || ''} ${result.failureReason || ''}`;
  if (result.deliveryStatus === 'SENT') {
    return 'sent';
  }
  if (
    !result.providerConfigured ||
    code.includes('WHATSAPP_PROVIDER_NOT_CONFIGURED') ||
    code.includes('PROVIDER_NOT_CONFIGURED')
  ) {
    return 'providerUnavailable';
  }
  if (result.deliveryStatus === 'SKIPPED' || code.toLowerCase().includes('already')) {
    return 'alreadySentToday';
  }
  if (code.includes('INVALID_RECIPIENT') || code.includes('RECIPIENT_MOBILE_MISSING')) {
    return 'invalidRecipient';
  }
  return 'failed';
}

export function paymentReminderToastKey(kind: ReminderToastKind): string {
  return `paymentCollection.reminder.${kind}`;
}
