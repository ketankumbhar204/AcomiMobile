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
import { Lock, Smartphone, TriangleAlert, UserRound } from 'lucide-react-native';
import { AuthHero } from '../../components/auth';
import { StickyFormActions } from '../../components/progressive';
import { useRegister } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '../../utils/indianMobile';
import { passwordsMatch, validatePassword } from '../../utils/passwordRules';

type RegisterNav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RegisterNav>();
  const { submit, isLoading, error, clearError } = useRegister();

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  function passwordMessage(code: ReturnType<typeof validatePassword>): string | null {
    if (code === 'required') {
      return t('auth.register.passwordRequired');
    }
    if (code === 'tooShort') {
      return t('auth.register.passwordTooShort');
    }
    if (code === 'tooLong') {
      return t('auth.register.passwordTooLong');
    }
    return null;
  }

  const canSubmit =
    fullName.trim().length > 0 &&
    isValidIndianMobile(mobileNumber) &&
    validatePassword(password) == null &&
    passwordsMatch(password, confirmPassword) &&
    !isLoading;

  async function handleCreateAccount() {
    Keyboard.dismiss();
    clearError();

    const nextNameError = fullName.trim() ? null : t('auth.register.nameRequired');
    const nextMobileError = !mobileNumber.trim()
      ? t('auth.login.mobileRequired')
      : isValidIndianMobile(mobileNumber)
        ? null
        : t('auth.login.mobileInvalid');
    const nextPasswordError = passwordMessage(validatePassword(password));
    const nextConfirmError = !confirmPassword
      ? t('auth.register.confirmPasswordRequired')
      : passwordsMatch(password, confirmPassword)
        ? null
        : t('auth.register.passwordMismatch');

    setNameError(nextNameError);
    setMobileError(nextMobileError);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    if (nextNameError || nextMobileError || nextPasswordError || nextConfirmError) {
      return;
    }

    await submit({
      fullName: fullName.trim(),
      mobileNumber,
      password,
      confirmPassword,
    });
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

          <View style={styles.fieldLabelRow}>
            <Lock size={14} color={colors.primaryDark} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>{t('auth.register.passwordLabel')}</Text>
          </View>
          <TextInput
            style={[
              styles.input,
              focusedField === 'password' && styles.inputFocused,
              passwordError ? styles.inputError : null,
            ]}
            placeholder={t('auth.register.passwordPlaceholder')}
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
            textContentType="newPassword"
            returnKeyType="next"
            accessibilityLabel={t('auth.register.passwordLabel')}
          />
          {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

          <View style={styles.fieldLabelRow}>
            <Lock size={14} color={colors.primaryDark} strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>{t('auth.register.confirmPasswordLabel')}</Text>
          </View>
          <TextInput
            style={[
              styles.input,
              focusedField === 'confirm' && styles.inputFocused,
              confirmError ? styles.inputError : null,
            ]}
            placeholder={t('auth.register.confirmPasswordPlaceholder')}
            placeholderTextColor={colors.muted}
            value={confirmPassword}
            onFocus={() => setFocusedField('confirm')}
            onBlur={() => setFocusedField(null)}
            onChangeText={text => {
              setConfirmPassword(text);
              if (confirmError) {
                setConfirmError(null);
              }
              if (error) {
                clearError();
              }
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={() => {
              handleCreateAccount();
            }}
            accessibilityLabel={t('auth.register.confirmPasswordLabel')}
          />
          {confirmError ? <Text style={styles.fieldError}>{confirmError}</Text> : null}
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
          label: t('auth.register.submit'),
          onPress: () => {
            handleCreateAccount();
          },
          loading: isLoading,
          disabled: !canSubmit,
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
