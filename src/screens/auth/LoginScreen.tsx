import React, { useState } from 'react';
import {
  Keyboard,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Lock, LogIn, Smartphone, TriangleAlert } from 'lucide-react-native';
import { AuthHero } from '../../components/auth';
import { StickyFormActions } from '../../components/progressive';
import { env } from '../../config/env';
import { useLogin, useSendOtp } from '../../hooks/useAuth';
import { useOtpCooldown } from '../../hooks/useOtpCooldown';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '../../utils/indianMobile';
import { formatCountdown } from '../../utils/otpAuthErrors';
import { validatePassword } from '../../utils/passwordRules';

type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
type LoginRoute = NativeStackScreenProps<AuthStackParamList, 'Login'>['route'];

export function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LoginNav>();
  const route = useRoute<LoginRoute>();
  const accountDeleted = Boolean(route.params?.accountDeleted);
  const { submit, isLoading, error, clearError } = useLogin();
  const { sendOtp, isLoading: isSendingOtp, error: otpError, clearError: clearOtpError } =
    useSendOtp();

  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'mobile' | 'password' | null>(null);

  const otpCooldown = useOtpCooldown(mobileNumber, 'LOGIN');
  const isValidPasswordForm =
    isValidIndianMobile(mobileNumber) && validatePassword(password) == null;
  const isValidOtp = isValidIndianMobile(mobileNumber) && otpCooldown === 0;
  const busy = isLoading || isSendingOtp;
  const bannerError = error || otpError;
  const formatError =
    mobileNumber.length === 10 && !isValidIndianMobile(mobileNumber)
      ? t('auth.login.mobileInvalid')
      : null;

  function validateMobile(value: string): string | null {
    if (!value.trim()) {
      return t('auth.login.mobileRequired');
    }
    if (!isValidIndianMobile(value)) {
      return t('auth.login.mobileInvalid');
    }
    return null;
  }

  function passwordMessage(code: ReturnType<typeof validatePassword>): string | null {
    if (code === 'required') {
      return t('auth.login.passwordRequired');
    }
    if (code === 'tooShort') {
      return t('auth.login.passwordTooShort');
    }
    if (code === 'tooLong') {
      return t('auth.login.passwordTooLong');
    }
    return null;
  }

  const fieldError = mobileError ?? formatError;

  async function handleSignIn() {
    Keyboard.dismiss();
    clearError();
    clearOtpError();

    const nextMobileError = validateMobile(mobileNumber);
    const nextPasswordError = passwordMessage(validatePassword(password));
    setMobileError(nextMobileError);
    setPasswordError(nextPasswordError);
    if (nextMobileError || nextPasswordError) {
      return;
    }

    await submit(mobileNumber, password);
  }

  async function handleSendOtp() {
    Keyboard.dismiss();
    clearError();
    clearOtpError();
    const nextMobileError = validateMobile(mobileNumber);
    setMobileError(nextMobileError);
    if (nextMobileError) {
      return;
    }
    const result = await sendOtp(mobileNumber, 'LOGIN');
    if (result) {
      navigation.navigate('OtpVerification', { mobileNumber, purpose: 'LOGIN' });
    }
  }

  function switchAuthMethod() {
    clearError();
    clearOtpError();
    setPasswordError(null);
    setAuthMethod(current => (current === 'otp' ? 'password' : 'otp'));
  }

  return (
    <View
      style={[
        styles.flex,
        {
          paddingTop: insets.top,
        },
      ]}
      collapsable={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        collapsable={false}>
        <View style={styles.brandSection} collapsable={false}>
          <View style={styles.logoWrap} collapsable={false}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <Text style={styles.appName}>{t('common.appName')}</Text>
        </View>

        <AuthHero
          icon={LogIn}
          eyebrow={t('auth.login.eyebrow', { defaultValue: 'Sign in' })}
          heading={t('auth.login.heading')}
          subheading={t('auth.login.subheading')}
        />

        {bannerError ? (
          <View style={styles.errorBanner}>
            <TriangleAlert size={16} color="#B91C1C" strokeWidth={2.2} />
            <Text style={styles.errorBannerText}>{bannerError}</Text>
          </View>
        ) : accountDeleted ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>
              {t('settings.profile.deleteAccountSuccess')}
            </Text>
          </View>
        ) : null}

        <View style={styles.phoneCard}>
          <View style={styles.fieldLabelRow}>
            <Smartphone size={14} color={colors.primaryDark} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>
              {t('auth.login.mobileLabel', { defaultValue: 'Mobile number' })}
            </Text>
          </View>
          <View style={styles.inputRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={[
                styles.phoneInput,
                focusedField === 'mobile' && styles.phoneInputFocused,
                fieldError ? styles.phoneInputError : null,
              ]}
              placeholder={t('auth.login.mobilePlaceholder')}
              placeholderTextColor={colors.muted}
              value={mobileNumber}
              onFocus={() => setFocusedField('mobile')}
              onBlur={() => setFocusedField(null)}
              onChangeText={text => {
                const digits = normalizeIndianMobileDigits(text);
                setMobileNumber(digits);
                if (mobileError) {
                  setMobileError(null);
                }
                if (error) {
                  clearError();
                }
                if (otpError) {
                  clearOtpError();
                }
              }}
              keyboardType="phone-pad"
              returnKeyType="next"
              maxLength={10}
              autoCorrect={false}
              accessibilityLabel={t('auth.login.mobileLabel', {
                defaultValue: 'Mobile number',
              })}
            />
          </View>
          {fieldError ? <Text style={styles.fieldError}>{fieldError}</Text> : null}

          {authMethod === 'password' ? (
            <>
              <View style={styles.fieldLabelRow}>
                <Lock size={14} color={colors.primaryDark} strokeWidth={2.2} />
                <Text style={styles.fieldLabel}>{t('auth.login.passwordLabel')}</Text>
              </View>
              <TextInput
                style={[
                  styles.phoneInput,
                  focusedField === 'password' && styles.phoneInputFocused,
                  passwordError ? styles.phoneInputError : null,
                ]}
                placeholder={t('auth.login.passwordPlaceholder')}
                placeholderTextColor={colors.muted}
                value={password}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                onChangeText={text => {
                  setPassword(text);
                  if (passwordError) {
                    setPasswordError(null);
                  }
                  if (error) {
                    clearError();
                  }
                }}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={() => {
                  void handleSignIn();
                }}
                accessibilityLabel={t('auth.login.passwordLabel')}
              />
              {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
            </>
          ) : null}
        </View>

        <Pressable
          style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
          onPress={() => navigation.navigate('Register')}
          accessibilityRole="button"
          accessibilityLabel={t('auth.login.registerLink')}>
          <Text style={styles.helper}>
            {t('auth.login.registerPrompt')}{' '}
            <Text style={styles.linkText}>{t('auth.login.registerLink')}</Text>
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
          onPress={() => {
            Linking.openURL(env.privacyPolicyUrl);
          }}
          accessibilityRole="link"
          accessibilityLabel={t('settings.profile.privacyPolicy')}>
          <Text style={styles.linkText}>{t('settings.profile.privacyPolicy')}</Text>
        </Pressable>
      </ScrollView>

      <StickyFormActions
        primary={{
          label:
            authMethod === 'otp'
              ? otpCooldown > 0
                ? t('auth.otp.sendOtpIn', { time: formatCountdown(otpCooldown) })
                : t('auth.login.sendOtp')
              : t('auth.login.submit'),
          onPress: () => {
            if (authMethod === 'otp') {
              void handleSendOtp();
              return;
            }
            void handleSignIn();
          },
          loading: busy,
          disabled: busy || (authMethod === 'otp' ? !isValidOtp : !isValidPasswordForm),
        }}
        footerExtra={
          <View style={styles.footerLinks}>
            {authMethod === 'password' ? (
              <Pressable
                style={({ pressed }) => [styles.footerLink, pressed && styles.linkPressed]}
                onPress={() => navigation.navigate('ForgotPassword')}
                accessibilityRole="button"
                accessibilityLabel={t('auth.login.forgotPassword')}>
                <Text style={styles.linkText}>{t('auth.login.forgotPassword')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.footerLink, pressed && styles.linkPressed]}
              onPress={switchAuthMethod}
              disabled={busy}
              accessibilityRole="button">
              <Text style={styles.otpInsteadText}>
                {authMethod === 'otp'
                  ? t('auth.login.modePassword')
                  : t('auth.login.otpInstead')}
              </Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    ...typography.body,
    flex: 1,
    color: '#DC2626',
  },
  successBanner: {
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  successBannerText: {
    ...typography.body,
    color: '#166534',
    fontWeight: '600',
    textAlign: 'center',
  },
  phoneCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  prefix: {
    minHeight: 48,
    minWidth: 72,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixText: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
  phoneInput: {
    flex: 1,
    minHeight: 48,
    backgroundColor: colors.white,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'android' ? 0 : spacing.md,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : null),
  },
  phoneInputFocused: {
    borderColor: colors.primary,
  },
  phoneInputError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  fieldError: {
    ...typography.caption,
    color: '#DC2626',
  },
  helper: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
  },
  linkRow: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  linkPressed: {
    opacity: 0.8,
  },
  linkText: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
    textAlign: 'center',
  },
  footerLinks: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  footerLink: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpInsteadText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
