import {
  ABSOLUTE_MAX_BYTES,
  computeTargetDimensions,
  fileLimitMessage,
  purposeMaxBytes,
  purposeMaxMb,
} from '../fileLimits';

describe('fileLimits', () => {
  it('never lets a purpose exceed 5 MB', () => {
    expect(purposeMaxBytes('MEMBER_DOCUMENT')).toBe(ABSOLUTE_MAX_BYTES);
    expect(purposeMaxBytes('IDENTITY_DOCUMENT')).toBe(ABSOLUTE_MAX_BYTES);
    expect(purposeMaxBytes('PROFILE_PHOTO')).toBe(2 * 1024 * 1024);
    expect(purposeMaxBytes('PAYMENT_PROOF')).toBe(4 * 1024 * 1024);
    expect(purposeMaxBytes('BUILDING_PHOTO')).toBe(ABSOLUTE_MAX_BYTES);
    expect(purposeMaxBytes('MENU_ITEM_PHOTO')).toBe(ABSOLUTE_MAX_BYTES);
    expect(purposeMaxBytes('SPACE_PHOTO')).toBe(ABSOLUTE_MAX_BYTES);
    expect(purposeMaxBytes('COMBO_PHOTO')).toBe(ABSOLUTE_MAX_BYTES);
  });

  it('does not upscale small images', () => {
    expect(computeTargetDimensions(800, 600, 1800)).toEqual({ width: 800, height: 600 });
  });

  it('scales the longest edge to the max dimension', () => {
    expect(computeTargetDimensions(4000, 3000, 1800)).toEqual({ width: 1800, height: 1350 });
  });

  it('returns a clear size error', () => {
    expect(fileLimitMessage('TOO_LARGE', 5)).toBe('File size must be 5 MB or less.');
    expect(fileLimitMessage('COMPRESS_FAILED')).toBe(
      'This image is too large to upload. Please choose a smaller image.',
    );
    expect(fileLimitMessage('UNSUPPORTED')).toBe('This file type is not supported.');
  });
});
