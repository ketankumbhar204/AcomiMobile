import { Linking, Share } from 'react-native';
import { copyTextToClipboard } from './copyTextToClipboard';
import {
  formatMemberContactNumber,
  isValidIndianMobile,
  normalizeIndianMobileDigits,
} from './indianMobile';
import { whatsAppPhoneDigits } from './photoRequest';

export type ContactActionResult = 'opened' | 'copied' | 'unavailable' | 'invalid';

/** Digits suitable for tel: / smsto: (+91 for valid Indian mobiles). */
export function contactTelDigits(value: string | null | undefined): string | null {
  const raw = value?.trim() ?? '';
  if (!raw) {
    return null;
  }
  const national = normalizeIndianMobileDigits(raw);
  if (isValidIndianMobile(national)) {
    return `+91${national}`;
  }
  const digits = raw.replace(/[^\d+]/g, '');
  return digits.length >= 8 ? digits : null;
}

export function contactDisplayNumber(value: string | null | undefined): string | null {
  return formatMemberContactNumber(value) ?? (value?.trim() || null);
}

export function canOpenContactOptions(value: string | null | undefined): boolean {
  return contactTelDigits(value) != null || Boolean(whatsAppPhoneDigits(value));
}

async function openUrl(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Prefill dialer only — never places a call. */
export async function openContactDialer(phone: string | null | undefined): Promise<ContactActionResult> {
  const digits = contactTelDigits(phone);
  if (!digits) {
    return 'invalid';
  }
  return (await openUrl(`tel:${digits}`)) ? 'opened' : 'unavailable';
}

/** Default SMS composer with recipient prefilled. */
export async function openContactSms(phone: string | null | undefined): Promise<ContactActionResult> {
  const digits = contactTelDigits(phone);
  if (!digits) {
    return 'invalid';
  }
  const opened = (await openUrl(`smsto:${digits}`)) || (await openUrl(`sms:${digits}`));
  return opened ? 'opened' : 'unavailable';
}

/**
 * Messaging chooser: prefer SMS URI; fall back to system Share sheet so the
 * user can pick a messaging app when SMS is unavailable.
 */
export async function openContactMessageChooser(
  phone: string | null | undefined,
): Promise<ContactActionResult> {
  const sms = await openContactSms(phone);
  if (sms === 'opened') {
    return sms;
  }
  if (sms === 'invalid') {
    return 'invalid';
  }
  const display = contactDisplayNumber(phone) ?? phone?.trim() ?? '';
  try {
    await Share.share({ message: display, title: display });
    return 'opened';
  } catch {
    return 'unavailable';
  }
}

export async function openContactWhatsApp(
  phone: string | null | undefined,
): Promise<ContactActionResult> {
  const digits = whatsAppPhoneDigits(phone);
  if (!digits) {
    return 'invalid';
  }
  const url = `https://wa.me/${digits}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      return 'unavailable';
    }
  } catch {
    // canOpenURL may fail on some Android builds; still try openURL.
  }
  return (await openUrl(url)) ? 'opened' : 'unavailable';
}

export function copyContactNumber(phone: string | null | undefined): ContactActionResult {
  const display = contactDisplayNumber(phone) ?? phone?.trim() ?? '';
  if (!display) {
    return 'invalid';
  }
  try {
    copyTextToClipboard(display);
    return 'copied';
  } catch {
    return 'unavailable';
  }
}
