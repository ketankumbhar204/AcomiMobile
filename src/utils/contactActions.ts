import { Linking, Platform, Share } from 'react-native';
import { copyTextToClipboard } from './copyTextToClipboard';
import {
  formatMemberContactNumber,
  isValidIndianMobile,
  normalizeIndianMobileDigits,
} from './indianMobile';
import { whatsAppChatUrl, whatsAppPhoneDigits } from './photoRequest';

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

async function openFirst(urls: string[]): Promise<boolean> {
  for (const url of urls) {
    if (await openUrl(url)) {
      return true;
    }
  }
  return false;
}

/** Prefill dialer only — never places a call. */
export async function openContactDialer(phone: string | null | undefined): Promise<ContactActionResult> {
  const digits = contactTelDigits(phone);
  if (!digits) {
    return 'invalid';
  }
  const targets = [`tel:${digits}`];
  if (Platform.OS === 'android') {
    const national = digits.replace(/^\+/, '');
    targets.push(
      `intent://${national}#Intent;scheme=tel;action=android.intent.action.DIAL;end`,
    );
  }
  return (await openFirst(targets)) ? 'opened' : 'unavailable';
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

/** Canonical WhatsApp link. Digits are country code + national number, with no '+' or spaces. */
export function whatsAppMeUrl(phone: string | null | undefined): string | null {
  const digits = whatsAppPhoneDigits(phone);
  return digits ? `https://wa.me/${digits}` : null;
}

/**
 * Opens WhatsApp for a phone number.
 * Optional `message` prefills chat text via wa.me `?text=` (never auto-sends).
 * Android 11+ hides packages from canOpenURL unless they are declared, so a
 * false result must not block the launch. Try Messenger and WhatsApp Business
 * directly, then the https://wa.me link, then the system browser.
 */
export async function openContactWhatsApp(
  phone: string | null | undefined,
  message?: string | null,
): Promise<ContactActionResult> {
  const digits = whatsAppPhoneDigits(phone);
  if (!digits) {
    return 'invalid';
  }
  const text = message?.trim() ?? '';
  const httpsUrl = text ? whatsAppChatUrl(phone, text) : `https://wa.me/${digits}`;
  if (!httpsUrl) {
    return 'invalid';
  }
  const waPath = text
    ? `wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `wa.me/${digits}`;
  const targets = [httpsUrl];
  if (Platform.OS === 'android') {
    const messenger = `intent://${waPath}#Intent;scheme=https;package=com.whatsapp;end`;
    const business = `intent://${waPath}#Intent;scheme=https;package=com.whatsapp.w4b;end`;
    const browser =
      `intent://${waPath}#Intent;scheme=https;action=android.intent.action.VIEW;` +
      'category=android.intent.category.BROWSABLE;end';
    targets.unshift(messenger, business);
    targets.push(browser);
  } else {
    const ios =
      text.length > 0
        ? `whatsapp://send?phone=${digits}&text=${encodeURIComponent(text)}`
        : `whatsapp://send?phone=${digits}`;
    targets.unshift(ios);
  }
  return (await openFirst(targets)) ? 'opened' : 'unavailable';
}

/** Opens the device contact editor with the name and number prefilled. */
export async function openSaveContact(
  phone: string | null | undefined,
  name: string | null | undefined,
): Promise<ContactActionResult> {
  const digits = contactTelDigits(phone);
  if (!digits) {
    return 'invalid';
  }
  const displayName = name?.trim() || contactDisplayNumber(phone) || digits;
  if (Platform.OS === 'android') {
    const intent =
      `intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.dir/raw_contact;` +
      `S.name=${encodeURIComponent(displayName)};S.phone=${encodeURIComponent(digits)};end`;
    if (await openUrl(intent)) {
      return 'opened';
    }
  }
  const card = `BEGIN:VCARD\nVERSION:3.0\nFN:${displayName}\nTEL;TYPE=CELL:${digits}\nEND:VCARD`;
  try {
    await Share.share({ message: card, title: displayName });
    return 'opened';
  } catch {
    return 'unavailable';
  }
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
