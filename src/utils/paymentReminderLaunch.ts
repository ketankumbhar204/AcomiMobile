import { Linking, Share } from 'react-native';
import type { PaymentReminderDeliveryResult } from '../api/paymentsApi';
import { whatsAppChatUrl } from './photoRequest';

export type ReminderLaunchResult = 'opened' | 'copied' | 'invalid' | 'failed';

export function reminderWhatsAppTarget(result: {
  messageText?: string | null;
  whatsAppUrl?: string | null;
  internationalPhone?: string | null;
}): { url: string | null; message: string } {
  const message = result.messageText?.trim() ?? '';
  const provided = result.whatsAppUrl?.trim() || null;
  const url =
    provided ||
    (result.internationalPhone && message
      ? whatsAppChatUrl(result.internationalPhone, message)
      : null);
  return { url, message };
}

export async function openReminderWhatsApp(
  result: Pick<
    PaymentReminderDeliveryResult,
    'messageText' | 'whatsAppUrl' | 'internationalPhone'
  >,
  editedMessage?: string | null,
): Promise<ReminderLaunchResult> {
  const edited = editedMessage?.trim();
  const target = edited
    ? {
        url: result.internationalPhone
          ? whatsAppChatUrl(result.internationalPhone, edited)
          : null,
        message: edited,
      }
    : reminderWhatsAppTarget(result);
  const { url, message } = target;
  if (!url) {
    if (!message) {
      return 'invalid';
    }
    try {
      await Share.share({ message });
      return 'copied';
    } catch {
      return 'invalid';
    }
  }
  try {
    await Linking.openURL(url);
    return 'opened';
  } catch {
    if (!message) {
      return 'failed';
    }
    try {
      await Share.share({ message });
      return 'copied';
    } catch {
      return 'failed';
    }
  }
}
