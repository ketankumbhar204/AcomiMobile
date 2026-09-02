import React, { useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { KeyRound, TriangleAlert } from 'lucide-react-native';
import { AuthHero, PasswordField } from '../../components/auth';
import { StickyFormActions } from '../../components/progressive';
import { useResetPassword } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import {
  isRegistrationTokenValid,
  useRegistrationDraftStore,
} from '../../store/registrationDraftStore';
import { colors, shadows, spacing, typography } from '../../theme';
import { confirmPasswordError, newPasswordError } from '../../utils/passwordMessages';

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

  async function handleSubmit() {
    Keyboard.dismiss();
    clearError();
    if (!mobileNumber || !verificationToken) {
      navigation.navigate('ForgotPassword');
      return;
    }
    const nextPasswordError = newPasswordError(t, password);
    const nextConfirmError = confirmPasswordError(t, password, confirmPassword);
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
              }}
              textContentType="newPassword"
              onSubmitEditing={() => {
                void handleSubmit();
              }}
            />
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
          disabled: isLoading,
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
