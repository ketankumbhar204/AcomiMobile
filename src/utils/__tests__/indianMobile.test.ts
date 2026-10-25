import { formatMemberContactNumber, normalizeIndianMobileDigits } from '../indianMobile';

describe('normalizeIndianMobileDigits', () => {
  it('keeps a 10-digit national number, including one that starts with 91', () => {
    expect(normalizeIndianMobileDigits('9876543210')).toBe('9876543210');
    expect(normalizeIndianMobileDigits('9123456789')).toBe('9123456789');
  });

  it('strips a country code instead of keeping the first 10 digits', () => {
    expect(normalizeIndianMobileDigits('+91 9876543210')).toBe('9876543210');
    expect(normalizeIndianMobileDigits('919876543210')).toBe('9876543210');
    expect(normalizeIndianMobileDigits('09876543210')).toBe('9876543210');
  });
});

describe('formatMemberContactNumber', () => {
  it('shows a valid Indian number with the country code', () => {
    expect(formatMemberContactNumber('9876543210')).toBe('+91 9876543210');
    expect(formatMemberContactNumber('+91 98765 43210')).toBe('+91 9876543210');
  });

  it('does not invent a number when the field is empty', () => {
    expect(formatMemberContactNumber('')).toBeNull();
    expect(formatMemberContactNumber('   ')).toBeNull();
    expect(formatMemberContactNumber(null)).toBeNull();
    expect(formatMemberContactNumber(undefined)).toBeNull();
  });

  it('keeps a stored non-mobile value instead of substituting digits', () => {
    expect(formatMemberContactNumber('desk-ext')).toBe('desk-ext');
  });
});
