import {
  formatMemberContactNumber,
  isValidIndianMobile,
  normalizeIndianMobileDigits,
} from './indianMobile';

const EMAIL = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

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
  const digits = nationalPhone(value);
  return digits ? `https://wa.me/91${digits}` : null;
}

export function mailtoHref(value: string | null | undefined): string | null {
  const email = value?.trim() ?? '';
  if (!email || !EMAIL.test(email)) {
    return null;
  }
  return `mailto:${email}`;
}
