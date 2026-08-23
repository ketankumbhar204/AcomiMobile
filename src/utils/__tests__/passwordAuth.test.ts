import fs from 'fs';
import path from 'path';
import en from '../../i18n/locales/en.json';
import { passwordsMatch, validatePassword } from '../passwordRules';

describe('password authentication', () => {
  it('validates password length without extra complexity rules', () => {
    expect(validatePassword('')).toBe('required');
    expect(validatePassword('short')).toBe('tooShort');
    expect(validatePassword('12345678')).toBeNull();
    expect(validatePassword('a'.repeat(73))).toBe('tooLong');
  });

  it('detects password mismatch', () => {
    expect(passwordsMatch('Secret12', 'Secret12')).toBe(true);
    expect(passwordsMatch('Secret12', 'Secret99')).toBe(false);
  });

  it('uses password copy for production login', () => {
    expect(en.auth.login.submit).toBe('Sign In');
    expect(en.auth.register.submit).toBe('Create Account');
    expect(en.auth.login.subheading.toLowerCase()).not.toContain('otp');
    expect(en.common.appName).toBe('ACOMI');
  });

  it('keeps login password-only and does not use OTP in the production register screen', () => {
    const authNavigator = fs.readFileSync(
      path.join(__dirname, '../../navigation/AuthNavigator.tsx'),
      'utf8',
    );
    const loginScreen = fs.readFileSync(
      path.join(__dirname, '../../screens/auth/LoginScreen.tsx'),
      'utf8',
    );
    const registerScreen = fs.readFileSync(
      path.join(__dirname, '../../screens/auth/RegisterScreen.tsx'),
      'utf8',
    );

    expect(authNavigator).toContain('RegisterScreen');
    expect(authNavigator).toContain('OtpScreen');
    expect(authNavigator).toContain('OtpVerification');
    expect(authNavigator).toContain('RegisterPassword');
    expect(loginScreen).not.toMatch(/useSendOtp|OtpVerification|sendOtp/);
    expect(loginScreen).toMatch(/useLogin/);
    expect(registerScreen).toMatch(/useRegister/);
    expect(registerScreen).not.toMatch(/useSendOtp|OtpVerification|sendOtp/);
    expect(registerScreen).toMatch(/secureTextEntry/);
    expect(fs.existsSync(path.join(__dirname, '../../screens/auth/OtpScreen.tsx'))).toBe(
      true,
    );
    expect(
      fs.existsSync(path.join(__dirname, '../../screens/auth/RegisterPasswordScreen.tsx')),
    ).toBe(true);
  });
});
