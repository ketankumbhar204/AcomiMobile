/** Valid 10-digit Indian mobile: first digit 6–9 (matches backend auth validation). */
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export function normalizeIndianMobileDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

export function isValidIndianMobile(value: string): boolean {
  return INDIAN_MOBILE_REGEX.test(normalizeIndianMobileDigits(value));
}
