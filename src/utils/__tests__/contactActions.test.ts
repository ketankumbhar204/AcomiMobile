import {
  canOpenContactOptions,
  contactDisplayNumber,
  contactTelDigits,
  copyContactNumber,
} from '../contactActions';

jest.mock('../copyTextToClipboard', () => ({
  copyTextToClipboard: jest.fn(),
}));

describe('contactActions', () => {
  it('formats valid Indian mobiles for dialer', () => {
    expect(contactTelDigits('9876543210')).toBe('+919876543210');
    expect(contactTelDigits('+91 98765 43210')).toBe('+919876543210');
  });

  it('rejects empty or short values', () => {
    expect(contactTelDigits('')).toBeNull();
    expect(contactTelDigits('123')).toBeNull();
    expect(canOpenContactOptions('')).toBe(false);
    expect(canOpenContactOptions('9876543210')).toBe(true);
  });

  it('displays formatted contact numbers', () => {
    expect(contactDisplayNumber('9876543210')).toBe('+91 9876543210');
  });

  it('copies display form', () => {
    const { copyTextToClipboard } = require('../copyTextToClipboard');
    expect(copyContactNumber('9876543210')).toBe('copied');
    expect(copyTextToClipboard).toHaveBeenCalledWith('+91 9876543210');
  });
});
