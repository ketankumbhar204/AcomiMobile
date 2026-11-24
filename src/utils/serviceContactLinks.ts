import { whatsAppMeUrl } from './contactActions';
import {
  formatMemberContactNumber,
  isValidIndianMobile,
  normalizeIndianMobileDigits,
} from './indianMobile';

const EMAIL = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export function contactInitials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function displayPhone(value: string | null | undefined): string | null {
  return formatMemberContactNumber(value);
}

export function nationalPhone(value: string | null | undefined): string {
  const digits = normalizeIndianMobileDigits(value ?? '');
  return isValidIndianMobile(digits) ? digits : '';
}

export function telHref(value: string | null | undefined): string | null {
  const digits = nationalPhone(value);
  return digits ? `tel:+91${digits}` : null;
}

export function whatsappHref(value: string | null | undefined): string | null {
  return whatsAppMeUrl(value);
}

/** Distinct dialable numbers in primary, alternate, then WhatsApp order. */
export function serviceContactNumbers(contact: {
  primaryPhone?: string | null;
  alternatePhone?: string | null;
  whatsappPhone?: string | null;
}): string[] {
  const numbers: string[] = [];
  const seen = new Set<string>();
  for (const value of [contact.primaryPhone, contact.alternatePhone, contact.whatsappPhone]) {
    const display = displayPhone(value);
    const key = nationalPhone(value) || (value ?? '').replace(/\D/g, '');
    if (!display || !key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    numbers.push(value as string);
  }
  return numbers;
}

export function mailtoHref(value: string | null | undefined): string | null {
  const email = value?.trim() ?? '';
  if (!email || !EMAIL.test(email)) {
    return null;
  }
  return `mailto:${email}`;
}
