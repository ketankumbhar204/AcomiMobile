/** Valid 10-digit Indian mobile: first digit 6–9 (matches backend auth validation). */
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

/**
 * Room for a pasted +91 / 0091 prefix. The value kept in state is still the
 * 10-digit national number. A maxLength of 10 would keep "91" and drop the suffix,
 * which then looks like a different valid mobile and fails password login.
 */
export const INDIAN_MOBILE_INPUT_MAX_LENGTH = 16;

/**
 * Strips spaces and a pasted +91 / 91 / leading 0 so login and test-user
 * creation send the same national number the backend stores.
 * A 10-digit number that itself starts with 91 is left unchanged.
 */
export function normalizeIndianMobileDigits(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length > 10 && digits.startsWith('91')) {
    digits = digits.slice(-10);
  }
  return digits.slice(0, 10);
}

export function isValidIndianMobile(value: string): boolean {
  return INDIAN_MOBILE_REGEX.test(normalizeIndianMobileDigits(value));
}

/**
 * Owner-facing contact line. Valid Indian numbers use +91 and the full national number.
 * Returns null when nothing is stored so the caller can show a fallback.
 */
export function formatMemberContactNumber(value: string | null | undefined): string | null {
  const raw = value?.trim() ?? '';
  if (!raw) {
    return null;
  }
  const digits = raw.replace(/\D/g, '');
  let national = digits;
  if (digits.length > 10 && digits.startsWith('91')) {
    national = digits.slice(-10);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    national = digits.slice(1);
  }
  if (INDIAN_MOBILE_REGEX.test(national)) {
    return `+91 ${national}`;
  }
  return raw;
}

/** Display form: +91 XXXXXX3210 */
export function maskIndianMobile(value: string): string {
  const digits = normalizeIndianMobileDigits(value);
  if (digits.length !== 10) {
    return '+91 XXXXXXXXXX';
  }
  return `+91 XXXXXX${digits.slice(6)}`;
}
