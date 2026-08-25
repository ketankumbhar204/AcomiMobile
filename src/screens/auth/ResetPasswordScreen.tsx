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
import { KeyRound, Lock, TriangleAlert } from 'lucide-react-native';
import { AuthHero } from '../../components/auth';
import { StickyFormActions } from '../../components/progressive';
import { useResetPassword } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import {
  isRegistrationTokenValid,
  useRegistrationDraftStore,
} from '../../store/registrationDraftStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { passwordsMatch, validatePassword } from '../../utils/passwordRules';

type ResetNav = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ResetNav>();
  const { resetPassword, isLoading, error, clearError } = useResetPassword();
  const mobileNumber = useRegistrationDraftStore(state => state.mobileNumber);
  const verificationToken = useRegistrationDraftStore(state => state.verificationToken);
  const tokenExpiresAt = useRegistrationDraftStore(state => state.verificationTokenExpiresAt);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'password' | 'confirm' | null>(null);
  const [resetComplete, setResetComplete] = useState(false);

  const tokenOk = isRegistrationTokenValid(verificationToken, tokenExpiresAt);

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
    Boolean(mobileNumber) &&
    tokenOk &&
    validatePassword(password) == null &&
    passwordsMatch(password, confirmPassword) &&
    !isLoading;

  async function handleSubmit() {
    Keyboard.dismiss();
    clearError();
    if (!mobileNumber || !verificationToken) {
      navigation.navigate('ForgotPassword');
      return;
    }
    const nextPasswordError = passwordMessage(validatePassword(password));
    const nextConfirmError = !confirmPassword
      ? t('auth.register.confirmPasswordRequired')
      : passwordsMatch(password, confirmPassword)
        ? null
        : t('auth.register.passwordMismatch');
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    if (nextPasswordError || nextConfirmError) {
      return;
    }
    const ok = await resetPassword({
      mobileNumber,
      verificationToken,
      password,
      confirmPassword,
    });
    if (ok) {
      setResetComplete(true);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }

  if (resetComplete) {
    return null;
  }

  if (!mobileNumber || !tokenOk) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <AuthHero
            icon={KeyRound}
            eyebrow={t('auth.forgotPassword.eyebrow')}
            heading={t('auth.forgotPassword.newPasswordHeading')}
            subheading={t('auth.forgotPassword.subheading')}
          />
          <Pressable
            style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
            onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.linkText}>{t('auth.forgotPassword.backToSignIn')}</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <AuthHero
          icon={KeyRound}
          eyebrow={t('auth.forgotPassword.eyebrow')}
          heading={t('auth.forgotPassword.newPasswordHeading')}
          subheading={t('auth.forgotPassword.newPasswordSubheading')}
        />

        {error ? (
          <View style={styles.errorBanner}>
            <TriangleAlert size={16} color="#B91C1C" strokeWidth={2.2} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
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
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
            />
            {confirmError ? <Text style={styles.fieldError}>{confirmError}</Text> : null}
          </View>

        <Pressable
          style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>{t('auth.forgotPassword.backToSignIn')}</Text>
        </Pressable>
      </ScrollView>

      <StickyFormActions
        primary={{
          label: t('auth.forgotPassword.newPasswordHeading'),
          onPress: () => {
            void handleSubmit();
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
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
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
});
