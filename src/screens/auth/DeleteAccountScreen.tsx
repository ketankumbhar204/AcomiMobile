import React, { useEffect, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { Check, Lock, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react-native';
import { AuthHero } from '../../components/auth';
import { StickyFormActions } from '../../components/progressive';
import { useAuthenticatedUser, useSendOtp } from '../../hooks/useAuth';
import { useDeleteAccount } from '../../hooks/useDeleteAccount';
import { useOtpCooldown } from '../../hooks/useOtpCooldown';
import type { MainStackParamList } from '../../navigation/types';
import { resetToLogin } from '../../navigation/navigationRef';
import { useRegistrationDraftStore } from '../../store/registrationDraftStore';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { maskIndianMobile, normalizeIndianMobileDigits } from '../../utils/indianMobile';
import { formatCountdown } from '../../utils/otpAuthErrors';
import { validatePassword } from '../../utils/passwordRules';

type DeleteNav = NativeStackNavigationProp<MainStackParamList, 'DeleteAccount'>;

export function DeleteAccountScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<DeleteNav>();
  const user = useAuthenticatedUser();
  const { sendOtp, isLoading: sendingOtp, error: otpSendError, clearError } = useSendOtp();
  const { deleteAccountByPassword, isDeleting } = useDeleteAccount();
  const showToast = useToastStore(state => state.showToast);
  const draftMobile = useRegistrationDraftStore(state => state.mobileNumber);
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'password' | null>(null);

  const mobileNumber = normalizeIndianMobileDigits(
    user?.mobileNumber ?? draftMobile ?? '',
  );
  const bannerError = localError || otpSendError;
  const busy = sendingOtp || isDeleting;
  const passwordValid = validatePassword(password) == null;
  const canDeletePassword = Boolean(mobileNumber) && passwordValid && confirmed && !busy;
  const otpCooldown = useOtpCooldown(mobileNumber, 'ACCOUNT_DELETION');
  const canSendOtp = Boolean(mobileNumber) && confirmed && !busy && otpCooldown === 0;

  useEffect(() => {
    navigation.setOptions({ title: t('settings.profile.deleteAccount') });
  }, [navigation, t]);

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

  function switchAuthMethod() {
    if (busy) {
      return;
    }
    clearError();
    setLocalError(null);
    setPasswordError(null);
    setAuthMethod(current => (current === 'otp' ? 'password' : 'otp'));
  }

  async function handleDeletePassword() {
    Keyboard.dismiss();
    clearError();
    setLocalError(null);
    const nextPasswordError = passwordMessage(validatePassword(password));
    setPasswordError(nextPasswordError);
    if (!confirmed || !mobileNumber || nextPasswordError) {
      return;
    }
    const result = await deleteAccountByPassword(mobileNumber, password);
    if (result.ok) {
      showToast(t('settings.profile.deleteAccountSuccess'));
      resetToLogin({ accountDeleted: true });
      return;
    }
    setLocalError(result.error);
  }

  async function handleSendOtp() {
    Keyboard.dismiss();
    clearError();
    setLocalError(null);
    if (!confirmed) {
      return;
    }
    if (!mobileNumber) {
      setLocalError(t('auth.login.mobileRequired'));
      return;
    }
    const result = await sendOtp(mobileNumber, 'ACCOUNT_DELETION');
    if (result) {
      navigation.navigate('DeleteAccountOtp', {
        mobileNumber,
        purpose: 'ACCOUNT_DELETION',
      });
    }
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <AuthHero
          icon={Trash2}
          eyebrow={t('settings.profile.deleteAccount')}
          heading={t('settings.profile.deleteAccountTitle')}
          subheading={t('settings.profile.deleteAccountMessage')}
        />

        {bannerError ? (
          <View style={styles.errorBanner}>
            <TriangleAlert size={16} color="#B91C1C" strokeWidth={2.2} />
            <Text style={styles.errorBannerText}>{bannerError}</Text>
          </View>
        ) : null}

        <View style={styles.warningCard}>
          {authMethod === 'otp' ? (
            <Text style={styles.hint}>{t('settings.profile.deleteAccountOtpHint')}</Text>
          ) : (
            <>
              <Text style={styles.hint}>{t('settings.profile.deleteAccountPersonalData')}</Text>
              <Text style={styles.hint}>{t('settings.profile.deleteAccountRecordsKept')}</Text>
            </>
          )}
          {mobileNumber ? (
            <View style={styles.mobileRow}>
              <ShieldCheck size={14} color={colors.primaryDark} strokeWidth={2.2} />
              <Text style={styles.mobileText}>{maskIndianMobile(mobileNumber)}</Text>
            </View>
          ) : null}
        </View>

        {authMethod === 'password' ? (
          <View style={styles.passwordCard}>
            <View style={styles.fieldLabelRow}>
              <Lock size={14} color={colors.primaryDark} strokeWidth={2.2} />
              <Text style={styles.fieldLabel}>{t('auth.login.passwordLabel')}</Text>
            </View>
            <TextInput
              style={[
                styles.passwordInput,
                focusedField === 'password' && styles.passwordInputFocused,
                passwordError ? styles.passwordInputError : null,
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
                if (localError) {
                  setLocalError(null);
                }
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="done"
              editable={!busy}
              onSubmitEditing={() => {
                void handleDeletePassword();
              }}
              accessibilityLabel={t('auth.login.passwordLabel')}
            />
            {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.confirmRow, pressed && styles.linkPressed]}
          onPress={() => {
            if (!busy) {
              setConfirmed(value => !value);
            }
          }}
          disabled={busy}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: confirmed }}>
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
            {confirmed ? <Check size={14} color={colors.white} strokeWidth={3} /> : null}
          </View>
          <Text style={styles.confirmLabel}>
            {t('settings.profile.deleteAccountUnderstand')}
          </Text>
        </Pressable>
      </ScrollView>

      <StickyFormActions
        primary={{
          label:
            authMethod === 'otp'
              ? otpCooldown > 0
                ? t('auth.otp.sendOtpIn', { time: formatCountdown(otpCooldown) })
                : t('settings.profile.deleteAccountSendOtp')
              : t('settings.profile.deleteAccountFinalConfirm'),
          onPress: () => {
            if (authMethod === 'otp') {
              void handleSendOtp();
              return;
            }
            void handleDeletePassword();
          },
          loading: busy,
          disabled: authMethod === 'otp' ? !canSendOtp : !canDeletePassword,
          style: authMethod === 'password' ? styles.destructiveButton : undefined,
        }}
        footerExtra={
          <Pressable
            style={({ pressed }) => [styles.otpInsteadRow, pressed && styles.linkPressed]}
            onPress={switchAuthMethod}
            disabled={busy}
            accessibilityRole="button">
            <Text style={styles.otpInsteadText}>
              {authMethod === 'otp'
                ? t('settings.profile.deleteAccountUsePassword')
                : t('settings.profile.deleteAccountOtpInstead')}
            </Text>
          </Pressable>
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
  warningCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  hint: {
    ...typography.body,
    color: '#9A3412',
  },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mobileText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  passwordCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.md,
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
  passwordInput: {
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
  passwordInputFocused: {
    borderColor: colors.primary,
  },
  passwordInputError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  fieldError: {
    ...typography.caption,
    color: '#DC2626',
  },
  confirmRow: {
    marginTop: spacing.lg,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  confirmLabel: {
    ...typography.body,
    flex: 1,
    color: colors.textSecondary,
  },
  linkPressed: {
    opacity: 0.8,
  },
  otpInsteadRow: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.md,
  },
  otpInsteadText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  destructiveButton: {
    backgroundColor: colors.danger,
  },
});
