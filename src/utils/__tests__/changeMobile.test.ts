import en from '../../i18n/locales/en.json';
import { ApiError } from '../../api/types';
import { mapOtpRequestError } from '../otpAuthErrors';

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

describe('change mobile number', () => {
  it('exposes change-mobile copy and keeps the current number read-only in profile', () => {
    expect(en.auth.changeMobile.heading).toBe('Change mobile number');
    expect(en.auth.changeMobile.sendOtp).toBe('Send OTP');
    expect(en.auth.changeMobile.sameNumber).toContain('different');
    expect(en.auth.changeMobile.success).toContain('updated');
    expect(en.settings.profile.changeMobile).toBe('Change mobile number');
  });

  it('requires CHANGE_MOBILE OTP on the new number before updating the session', () => {
    const fs = require('fs');
    const path = require('path');
    const profileScreen = fs.readFileSync(
      path.join(__dirname, '../../screens/ProfileScreen.tsx'),
      'utf8',
    );
    const completeProfile = fs.readFileSync(
      path.join(__dirname, '../../screens/onboarding/CompleteProfileScreen.tsx'),
      'utf8',
    );
    const changeScreen = fs.readFileSync(
      path.join(__dirname, '../../screens/auth/ChangeMobileScreen.tsx'),
      'utf8',
    );
    const otpScreen = fs.readFileSync(
      path.join(__dirname, '../../screens/auth/OtpScreen.tsx'),
      'utf8',
    );
    const authApi = fs.readFileSync(path.join(__dirname, '../../api/authApi.ts'), 'utf8');
    const navigator = fs.readFileSync(
      path.join(__dirname, '../../navigation/MainNavigator.tsx'),
      'utf8',
    );
    const types = fs.readFileSync(path.join(__dirname, '../../api/types.ts'), 'utf8');

    expect(types).toContain("'CHANGE_MOBILE'");
    expect(profileScreen).toContain("navigate('ChangeMobile')");
    expect(completeProfile).toContain("navigate('ChangeMobile')");
    expect(changeScreen).toContain("'CHANGE_MOBILE'");
    expect(changeScreen).toContain('sendOtp');
    expect(changeScreen).not.toContain('changeMobile(');
    expect(otpScreen).toContain('CHANGE_MOBILE');
    expect(otpScreen).toContain('authApi.changeMobile');
    expect(otpScreen).toContain("navigate('Profile')");
    expect(otpScreen).toContain('setSession');
    expect(authApi).toContain('/auth/change-mobile');
    expect(navigator).toContain('ChangeMobile');
    expect(navigator).toContain('ChangeMobileOtp');
  });

  it('keeps CHANGE_MOBILE 409 as already-registered rather than a generic send-otp error', () => {
    expect(
      mapOtpRequestError(
        new ApiError('This mobile number is already registered.', 409),
        'CHANGE_MOBILE',
      ),
    ).toBe(en.common.errors.mobileAlreadyRegistered);
  });
});
