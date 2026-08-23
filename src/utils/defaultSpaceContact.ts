import { isValidIndianMobile } from './indianMobile';

function digitsOf(value: string): string {
  return value.replace(/\D/g, '');
}

/** Last 10 digits when a country code is present; otherwise the raw digits. */
export function usableMobileNumber(value: string | null | undefined): string {
  const digits = digitsOf(value ?? '');
  if (!digits) {
    return '';
  }
  const local = digits.length > 10 ? digits.slice(-10) : digits;
  return isValidIndianMobile(local) ? local : '';
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const withPad = padded.length % 4 === 0 ? padded : padded + '='.repeat(4 - (padded.length % 4));
  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(withPad);
  }
  const BufferCtor = (globalThis as { Buffer?: { from: (s: string, enc: string) => { toString: (enc: string) => string } } }).Buffer;
  if (BufferCtor) {
    return BufferCtor.from(withPad, 'base64').toString('utf8');
  }
  return '';
}

export function mobileNumberFromAccessToken(accessToken: string | null | undefined): string {
  if (!accessToken) {
    return '';
  }
  try {
    const payloadPart = accessToken.split('.')[1];
    if (!payloadPart) {
      return '';
    }
    const json = decodeBase64Url(payloadPart);
    if (!json) {
      return '';
    }
    const payload = JSON.parse(json) as { mobileNumber?: unknown };
    return typeof payload.mobileNumber === 'string' ? usableMobileNumber(payload.mobileNumber) : '';
  } catch {
    return '';
  }
}

/**
 * Prefill for Create Space contact:
 * 1. logged-in user's mobile
 * 2. JWT mobileNumber (same account identity if the profile object is missing it)
 * 3. existing account/space owner contact when creating another space
 */
export function resolveDefaultSpaceContact(options: {
  userMobile?: string | null;
  accessToken?: string | null;
  ownerMobile?: string | null;
}): string {
  return (
    usableMobileNumber(options.userMobile) ||
    mobileNumberFromAccessToken(options.accessToken) ||
    usableMobileNumber(options.ownerMobile)
  );
}
