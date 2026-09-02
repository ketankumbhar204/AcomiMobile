import React, { useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Smartphone, TriangleAlert, UserRound } from 'lucide-react-native';
import { AuthHero, PasswordField } from '../../components/auth';
import { StickyFormActions } from '../../components/progressive';
import { useSendOtp } from '../../hooks/useAuth';
import { useOtpCooldown } from '../../hooks/useOtpCooldown';
import type { AuthStackParamList } from '../../navigation/types';
import { useRegistrationDraftStore } from '../../store/registrationDraftStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '../../utils/indianMobile';
import { formatCountdown } from '../../utils/otpAuthErrors';
import { confirmPasswordError, newPasswordError } from '../../utils/passwordMessages';

type RegisterNav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RegisterNav>();
  const { sendOtp, isLoading, error, clearError } = useSendOtp();
  const setCredentials = useRegistrationDraftStore(state => state.setCredentials);

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const cooldown = useOtpCooldown(mobileNumber, 'REGISTER');

  async function handleCreateAccount() {
    Keyboard.dismiss();
    clearError();

    const nextNameError = fullName.trim() ? null : t('auth.register.nameRequired');
    const nextMobileError = !mobileNumber.trim()
      ? t('auth.login.mobileRequired')
      : isValidIndianMobile(mobileNumber)
        ? null
        : t('auth.login.mobileInvalid');
    const nextPasswordError = newPasswordError(t, password);
    const nextConfirmError = confirmPasswordError(t, password, confirmPassword);

    setNameError(nextNameError);
    setMobileError(nextMobileError);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    if (nextNameError || nextMobileError || nextPasswordError || nextConfirmError) {
      return;
    }

    setCredentials({
      fullName: fullName.trim(),
      password,
      confirmPassword,
    });
    const result = await sendOtp(mobileNumber, 'REGISTER');
    if (result) {
      navigation.navigate('OtpVerification', { mobileNumber, purpose: 'REGISTER' });
    }
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]} collapsable={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        collapsable={false}>
        <AuthHero
          icon={UserRound}
          eyebrow={t('auth.register.eyebrow')}
          heading={t('auth.register.heading')}
          subheading={t('auth.register.subheading')}
        />

        {error ? (
          <View style={styles.errorBanner}>
            <TriangleAlert size={16} color="#B91C1C" strokeWidth={2.2} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.fieldLabelRow}>
            <UserRound size={14} color={colors.primaryDark} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>{t('auth.register.nameLabel')}</Text>
          </View>
          <TextInput
            style={[
              styles.input,
              focusedField === 'name' && styles.inputFocused,
              nameError ? styles.inputError : null,
            ]}
            placeholder={t('auth.register.namePlaceholder')}
            placeholderTextColor={colors.muted}
            value={fullName}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            onChangeText={text => {
              setFullName(text);
              if (nameError) {
                setNameError(null);
              }
              if (error) {
                clearError();
              }
            }}
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel={t('auth.register.nameLabel')}
          />
          {nameError ? <Text style={styles.fieldError}>{nameError}</Text> : null}

          <View style={styles.fieldLabelRow}>
            <Smartphone size={14} color={colors.primaryDark} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>{t('auth.login.mobileLabel')}</Text>
          </View>
          <View style={styles.inputRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={[
                styles.input,
                focusedField === 'mobile' && styles.inputFocused,
                mobileError ? styles.inputError : null,
              ]}
              placeholder={t('auth.login.mobilePlaceholder')}
              placeholderTextColor={colors.muted}
              value={mobileNumber}
              onFocus={() => setFocusedField('mobile')}
              onBlur={() => setFocusedField(null)}
              onChangeText={text => {
                setMobileNumber(normalizeIndianMobileDigits(text));
                if (mobileError) {
                  setMobileError(null);
                }
                if (error) {
                  clearError();
                }
              }}
              keyboardType="phone-pad"
              maxLength={10}
              returnKeyType="next"
              accessibilityLabel={t('auth.login.mobileLabel')}
            />
          </View>
          {mobileError ? <Text style={styles.fieldError}>{mobileError}</Text> : null}

          <PasswordField
            label={t('auth.register.passwordLabel')}
            placeholder={t('auth.register.passwordPlaceholder')}
            value={password}
            focused={focusedField === 'password'}
            error={passwordError}
            onFocus={() => setFocusedField('password')}
            onBlur={() => {
              setFocusedField(null);
              setPasswordError(newPasswordError(t, password));
              if (confirmPassword) {
                setConfirmError(confirmPasswordError(t, password, confirmPassword));
              }
            }}
            onChangeText={text => {
              setPassword(text);
              if (passwordError) {
                setPasswordError(newPasswordError(t, text));
              }
              if (confirmPassword) {
                setConfirmError(confirmPasswordError(t, text, confirmPassword));
              }
              if (error) {
                clearError();
              }
            }}
            textContentType="newPassword"
            returnKeyType="next"
          />

          <PasswordField
            label={t('auth.register.confirmPasswordLabel')}
            placeholder={t('auth.register.confirmPasswordPlaceholder')}
            value={confirmPassword}
            focused={focusedField === 'confirm'}
            error={confirmError}
            onFocus={() => setFocusedField('confirm')}
            onBlur={() => {
              setFocusedField(null);
              setConfirmError(confirmPasswordError(t, password, confirmPassword));
            }}
            onChangeText={text => {
              setConfirmPassword(text);
              if (confirmError || text.length > 0) {
                setConfirmError(confirmPasswordError(t, password, text));
              }
              if (error) {
                clearError();
              }
            }}
            textContentType="newPassword"
            onSubmitEditing={() => {
              void handleCreateAccount();
            }}
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button">
          <Text style={styles.helper}>
            {t('auth.register.loginPrompt')}{' '}
            <Text style={styles.linkText}>{t('auth.register.loginLink')}</Text>
          </Text>
        </Pressable>
      </ScrollView>

      <StickyFormActions
        primary={{
          label:
            cooldown > 0
              ? t('auth.otp.sendOtpIn', { time: formatCountdown(cooldown) })
              : t('auth.register.submit'),
          onPress: () => {
            handleCreateAccount();
          },
          loading: isLoading,
          disabled: isLoading || cooldown > 0,
        }}
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
  card: {
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
    marginTop: spacing.xs,
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
  input: {
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
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
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
    marginTop: spacing.lg,
  },
  linkPressed: {
    opacity: 0.8,
  },
  linkText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
