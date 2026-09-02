import type { TFunction } from 'i18next';
import {
  passwordsMatch,
  validatePassword,
  type PasswordValidationCode,
} from './passwordRules';

function mapPasswordCode(
  t: TFunction,
  code: PasswordValidationCode,
  keys: { required: string; tooShort: string; tooLong: string },
): string | null {
  if (code === 'required') {
    return t(keys.required);
  }
  if (code === 'tooShort') {
    return t(keys.tooShort);
  }
  if (code === 'tooLong') {
    return t(keys.tooLong);
  }
  return null;
}

export function loginPasswordError(t: TFunction, password: string): string | null {
  return mapPasswordCode(t, validatePassword(password), {
    required: 'auth.login.passwordRequired',
    tooShort: 'auth.login.passwordTooShort',
    tooLong: 'auth.login.passwordTooLong',
  });
}

export function newPasswordError(t: TFunction, password: string): string | null {
  return mapPasswordCode(t, validatePassword(password), {
    required: 'auth.register.passwordRequired',
    tooShort: 'auth.register.passwordTooShort',
    tooLong: 'auth.register.passwordTooLong',
  });
}

export function confirmPasswordError(
  t: TFunction,
  password: string,
  confirmPassword: string,
): string | null {
  if (!confirmPassword) {
    return t('auth.register.confirmPasswordRequired');
  }
  if (!passwordsMatch(password, confirmPassword)) {
    return t('auth.register.passwordMismatch');
  }
  return null;
}
