import type { TFunction } from 'i18next';
import {
  confirmPasswordError,
  loginPasswordError,
  newPasswordError,
} from '../passwordMessages';

const t = ((key: string) => key) as TFunction;

describe('passwordMessages', () => {
  it('maps login password format errors', () => {
    expect(loginPasswordError(t, '')).toBe('auth.login.passwordRequired');
    expect(loginPasswordError(t, 'short')).toBe('auth.login.passwordTooShort');
    expect(loginPasswordError(t, 'a'.repeat(73))).toBe('auth.login.passwordTooLong');
    expect(loginPasswordError(t, '12345678')).toBeNull();
  });

  it('maps new password format errors', () => {
    expect(newPasswordError(t, '')).toBe('auth.register.passwordRequired');
    expect(newPasswordError(t, 'short')).toBe('auth.register.passwordTooShort');
    expect(newPasswordError(t, 'a'.repeat(73))).toBe('auth.register.passwordTooLong');
    expect(newPasswordError(t, '12345678')).toBeNull();
  });

  it('requires confirm password and detects mismatch', () => {
    expect(confirmPasswordError(t, 'Secret12', '')).toBe(
      'auth.register.confirmPasswordRequired',
    );
    expect(confirmPasswordError(t, 'Secret12', 'Secret99')).toBe(
      'auth.register.passwordMismatch',
    );
    expect(confirmPasswordError(t, 'Secret12', 'Secret12')).toBeNull();
  });
});
