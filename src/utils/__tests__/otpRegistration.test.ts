import fs from 'fs';
import path from 'path';
import { ApiError } from '../../api/types';
import en from '../../i18n/locales/en.json';
import {
  isRegistrationTokenValid,
  useRegistrationDraftStore,
} from '../../store/registrationDraftStore';
import {
  formatCountdown,
  mapOtpRequestError,
  mapOtpVerifyError,
  mapRegistrationTokenError,
} from '../otpAuthErrors';

jest.mock('../../i18n', () => {
  const locale = require('../../i18n/locales/en.json');
  const valueAt = (tree: Record<string, unknown>, keyPath: string) =>
    keyPath.split('.').reduce<unknown>((current, segment) => {
      if (current == null || typeof current !== 'object') {
        return undefined;
      }
      return (current as Record<string, unknown>)[segment];
    }, tree);

  return {
    i18n: {
      t: (key: string) => valueAt(locale, key) ?? key,
    },
  };
});

const AUTH_API = fs.readFileSync(path.join(__dirname, '../../api/authApi.ts'), 'utf8');
const USE_AUTH = fs.readFileSync(path.join(__dirname, '../../hooks/useAuth.ts'), 'utf8');
const OTP_SCREEN = fs.readFileSync(
  path.join(__dirname, '../../screens/auth/OtpScreen.tsx'),
  'utf8',
);
const REGISTER_SCREEN = fs.readFileSync(
  path.join(__dirname, '../../screens/auth/RegisterScreen.tsx'),
  'utf8',
);
const PASSWORD_SCREEN = fs.readFileSync(
  path.join(__dirname, '../../screens/auth/RegisterPasswordScreen.tsx'),
  'utf8',
);
const LOGIN_SCREEN = fs.readFileSync(
  path.join(__dirname, '../../screens/auth/LoginScreen.tsx'),
  'utf8',
);
const FORGOT_SCREEN = fs.readFileSync(
  path.join(__dirname, '../../screens/auth/ForgotPasswordScreen.tsx'),
  'utf8',
);
const RESET_SCREEN = fs.readFileSync(
  path.join(__dirname, '../../screens/auth/ResetPasswordScreen.tsx'),
  'utf8',
);
const DELETE_SCREEN = fs.readFileSync(
  path.join(__dirname, '../../screens/auth/DeleteAccountScreen.tsx'),
  'utf8',
);
const CHANGE_MOBILE_SCREEN = fs.readFileSync(
  path.join(__dirname, '../../screens/auth/ChangeMobileScreen.tsx'),
  'utf8',
);
const API_TYPES = fs.readFileSync(path.join(__dirname, '../../api/types.ts'), 'utf8');

describe('OTP registration contract', () => {
  beforeEach(() => {
    useRegistrationDraftStore.getState().clear();
  });

  it('sends purpose REGISTER and does not treat verify-otp as a JWT session', () => {
    expect(AUTH_API).toContain('payload.purpose');
    expect(AUTH_API).toMatch(/post<ApiResponse<SendOtpResponse>>\('\/auth\/send-otp'/);
    expect(AUTH_API).toMatch(/post<ApiResponse<VerifyOtpResponse>>\('\/auth\/verify-otp'/);
    expect(AUTH_API).toContain('payload.verificationToken');
    expect(USE_AUTH).toContain("purpose: OtpPurpose = 'REGISTER'");
    const verifyHook = USE_AUTH.slice(
      USE_AUTH.indexOf('export function useVerifyOtp'),
      USE_AUTH.indexOf('export function useLogin'),
    );
    expect(verifyHook).toContain('setVerified(result.verificationToken, result.expiresIn)');
    expect(verifyHook).not.toContain('setSession');
    const registerHook = USE_AUTH.slice(USE_AUTH.indexOf('export function useRegister'));
    expect(registerHook).toContain('setSession(result.user, result.accessToken)');
  });

  it('never hardcodes a client OTP bypass', () => {
    const sources = [OTP_SCREEN, REGISTER_SCREEN, PASSWORD_SCREEN, LOGIN_SCREEN, USE_AUTH, AUTH_API];
    for (const source of sources) {
      expect(source).not.toMatch(/\b111111\b/);
      expect(source).not.toMatch(/\b123456\b/);
    }
    expect(en.auth.otp.devHint.toLowerCase()).not.toContain('111111');
    expect(en.auth.otp.devHint.toLowerCase()).not.toContain('123456');
    expect(en.auth.otp.devHint.toLowerCase()).toContain('development log');
  });

  it('does not put verification tokens in navigation params', () => {
    expect(REGISTER_SCREEN).not.toContain('verificationToken');
    expect(PASSWORD_SCREEN).toContain('useRegistrationDraftStore');
    const navTypes = fs.readFileSync(
      path.join(__dirname, '../../navigation/types.ts'),
      'utf8',
    );
    expect(navTypes).not.toMatch(/OtpVerification:[\s\S]{0,120}verificationToken/);
    expect(navTypes).not.toMatch(/RegisterPassword:[\s\S]{0,120}verificationToken/);
  });

  it('stores a short-lived verification token only in memory', () => {
    const store = useRegistrationDraftStore.getState();
    store.beginOtp('9876543210', 300, 60);
    expect(useRegistrationDraftStore.getState().mobileNumber).toBe('9876543210');
    expect(useRegistrationDraftStore.getState().verificationToken).toBeNull();

    store.setVerified('token-abc', 600);
    expect(useRegistrationDraftStore.getState().verificationToken).toBe('token-abc');
    expect(
      isRegistrationTokenValid(
        useRegistrationDraftStore.getState().verificationToken,
        useRegistrationDraftStore.getState().verificationTokenExpiresAt,
      ),
    ).toBe(true);

    store.markResent(300, 60);
    expect(useRegistrationDraftStore.getState().verificationToken).toBeNull();
    expect(
      isRegistrationTokenValid('stale', Date.now() - 1000),
    ).toBe(false);
  });

  it('maps OTP and registration token failures to user-facing copy', () => {
    expect(mapOtpVerifyError(new ApiError('Invalid OTP', 400))).toBe(
      en.common.errors.incorrectOtp,
    );
    expect(mapOtpVerifyError(new ApiError('OTP has expired. Request a new one.', 400))).toBe(
      en.common.errors.otpExpired,
    );
    expect(
      mapOtpVerifyError(new ApiError('Too many incorrect attempts. Request a new OTP.', 400)),
    ).toBe(en.common.errors.otpMaxAttempts);
    expect(mapOtpRequestError(new ApiError('Please wait before requesting another OTP.', 429))).toBe(
      en.common.errors.otpCooldown,
    );
    expect(mapOtpRequestError(new ApiError('Too many OTP requests. Please try again later.', 429))).toBe(
      en.common.errors.otpRateLimited,
    );
    expect(
      mapRegistrationTokenError(new ApiError('Verification token has expired', 400)),
    ).toBe(en.common.errors.registrationTokenExpired);
    expect(
      mapOtpVerifyError(new ApiError('Unable to send OTP right now.', 503)),
    ).toBe(en.common.errors.verifyOtp);
    expect(mapOtpRequestError(new ApiError('Network error', 0, undefined, true))).toBe(
      en.common.errors.network,
    );
    expect(
      mapOtpRequestError(new ApiError('This mobile number is already registered.', 409), 'RESET_PASSWORD'),
    ).toBe(en.common.errors.sendOtp);
    expect(
      mapOtpRequestError(new ApiError('This mobile number is already registered.', 409), 'REGISTER'),
    ).toBe(en.common.errors.mobileAlreadyRegistered);
    expect(
      mapOtpRequestError(new ApiError('This mobile number is already registered.', 409), 'CHANGE_MOBILE'),
    ).toBe(en.common.errors.mobileAlreadyRegistered);
  });

  it('surfaces a missing account instead of advancing to the OTP screen', () => {
    expect(
      mapOtpRequestError(
        new ApiError('No ACOMI account found with this mobile number.', 404),
        'LOGIN',
      ),
    ).toBe(en.common.errors.accountNotFound);
    expect(
      mapOtpRequestError(
        new ApiError('No ACOMI account found with this mobile number.', 404),
        'RESET_PASSWORD',
      ),
    ).toBe(en.common.errors.accountNotFound);
    // Deleting the account between send and verify must not read as a wrong code.
    expect(
      mapOtpVerifyError(new ApiError('No ACOMI account found with this mobile number.', 404)),
    ).toBe(en.common.errors.accountNotFound);
  });

  it('formats countdown using backend-provided remaining seconds', () => {
    expect(formatCountdown(65)).toBe('1:05');
    expect(formatCountdown(0)).toBe('0:00');
  });

  it('keeps password login available and starts OTP from register or login OTP mode', () => {
    expect(LOGIN_SCREEN).toMatch(/useLogin/);
    expect(LOGIN_SCREEN).toMatch(/useSendOtp/);
    expect(LOGIN_SCREEN).toMatch(/'LOGIN'/);
    expect(LOGIN_SCREEN).toContain("otpInstead");
    expect(LOGIN_SCREEN).not.toContain('modeRow');
    expect(REGISTER_SCREEN).toMatch(/useSendOtp/);
    expect(REGISTER_SCREEN).toMatch(/OtpVerification/);
    expect(USE_AUTH).toMatch(/authApi\.login\(\{ mobileNumber, password \}\)/);
    expect(AUTH_API).toContain("'/auth/login-with-otp'");
    expect(AUTH_API).toContain("'/auth/reset-password'");
    expect(FORGOT_SCREEN).toContain("'RESET_PASSWORD'");
    expect(FORGOT_SCREEN).not.toMatch(/already registered|accountExists|getMe\(/);
    expect(RESET_SCREEN).toContain('useResetPassword');
    expect(RESET_SCREEN).toContain("name: 'Login'");
  });

  it('counts down the resend cooldown on every screen that sends an OTP', () => {
    const screens: Array<[string, string]> = [
      ['login', LOGIN_SCREEN],
      ['register', REGISTER_SCREEN],
      ['forgot password', FORGOT_SCREEN],
      ['delete account', DELETE_SCREEN],
      ['change mobile', CHANGE_MOBILE_SCREEN],
      ['otp', OTP_SCREEN],
    ];
    for (const [name, source] of screens) {
      expect([name, source.includes('useOtpCooldown')]).toEqual([name, true]);
    }
    expect(en.auth.otp.sendOtpIn).toContain('{{time}}');
  });

  it('records the cooldown from a successful send and from a throttled send', () => {
    expect(USE_AUTH).toContain('noteCooldown');
    expect(USE_AUTH).toContain('err.retryAfterSeconds');
    expect(API_TYPES).toContain('retryAfterSeconds');

    const store = useRegistrationDraftStore.getState();
    store.noteCooldown('9876543210', 'LOGIN', 45);
    const state = useRegistrationDraftStore.getState();
    expect(state.cooldownMobile).toBe('9876543210');
    expect(state.cooldownPurpose).toBe('LOGIN');
    expect(state.cooldownUntil).toBeGreaterThan(Date.now());

    store.clear();
    expect(useRegistrationDraftStore.getState().cooldownUntil).toBeNull();
  });
});
