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
    expect(en.auth.login.modeOtp.toLowerCase()).toContain('otp');
    expect(en.common.appName).toBe('ACOMI');
  });

  it('keeps password login and adds OTP login plus forgot-password screens', () => {
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
    expect(authNavigator).toContain('ForgotPassword');
    expect(authNavigator).toContain('ResetPassword');
    expect(loginScreen).toMatch(/useLogin/);
    expect(loginScreen).toMatch(/useSendOtp/);
    expect(loginScreen).toMatch(/ForgotPassword/);
    expect(registerScreen).toMatch(/useSendOtp/);
    expect(registerScreen).toMatch(/OtpVerification/);
    expect(registerScreen).toMatch(/secureTextEntry/);
    expect(fs.existsSync(path.join(__dirname, '../../screens/auth/OtpScreen.tsx'))).toBe(
      true,
    );
    expect(
      fs.existsSync(path.join(__dirname, '../../screens/auth/RegisterPasswordScreen.tsx')),
    ).toBe(true);
  });
});
