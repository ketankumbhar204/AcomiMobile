import { resolveDefaultSpaceContact, usableMobileNumber } from '../defaultSpaceContact';

function tokenWithMobile(mobileNumber: string): string {
  const payload = btoa(JSON.stringify({ mobileNumber }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${payload}.sig`;
}

describe('defaultSpaceContact', () => {
  it('prefers the logged-in user mobile', () => {
    expect(
      resolveDefaultSpaceContact({
        userMobile: '9370338430',
        accessToken: tokenWithMobile('9999999999'),
        ownerMobile: '8888888888',
      }),
    ).toBe('9370338430');
  });

  it('falls back to JWT mobile when the user profile has none', () => {
    expect(
      resolveDefaultSpaceContact({
        userMobile: '',
        accessToken: tokenWithMobile('9370338430'),
        ownerMobile: '8888888888',
      }),
    ).toBe('9370338430');
  });

  it('falls back to account owner contact last', () => {
    expect(
      resolveDefaultSpaceContact({
        userMobile: null,
        accessToken: null,
        ownerMobile: '8888888888',
      }),
    ).toBe('8888888888');
  });

  it('strips country code from +91 numbers', () => {
    expect(usableMobileNumber('+91 9370338430')).toBe('9370338430');
  });
});
