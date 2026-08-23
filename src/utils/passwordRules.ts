export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export type PasswordValidationCode =
  | 'required'
  | 'tooShort'
  | 'tooLong'
  | null;

export function validatePassword(password: string): PasswordValidationCode {
  if (!password) {
    return 'required';
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return 'tooShort';
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return 'tooLong';
  }
  return null;
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}
