import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Pencil, ShieldCheck, TriangleAlert } from 'lucide-react-native';
import { AuthHero } from '../../components/auth';
import { DeleteAccountConfirmModal } from '../../components/auth/DeleteAccountConfirmModal';
import { StickyFormActions } from '../../components/progressive';
import { HeaderBackButton, OtpInput } from '../../components/ui';
import { useCountdown } from '../../hooks/useCountdown';
import {
  useLoginWithOtp,
  useRegister,
  useSendOtp,
  useVerifyOtp,
} from '../../hooks/useAuth';
import { useDeleteAccount } from '../../hooks/useDeleteAccount';
import type { AuthStackParamList, MainStackParamList } from '../../navigation/types';
import { resetToLogin } from '../../navigation/navigationRef';
import {
  isRegistrationTokenValid,
  useRegistrationDraftStore,
} from '../../store/registrationDraftStore';
import { useToastStore } from '../../store/toastStore';
import { colors, shadows, spacing, typography } from '../../theme';
import type { OtpPurpose } from '../../api/types';
import { formatCountdown } from '../../utils/otpAuthErrors';
import { maskIndianMobile } from '../../utils/indianMobile';

type OtpNav = NativeStackNavigationProp<AuthStackParamList & MainStackParamList>;
type OtpRoute = NativeStackScreenProps<AuthStackParamList & MainStackParamList, 'OtpVerification' | 'DeleteAccountOtp'>['route'];

export function OtpScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<OtpNav>();
  const route = useRoute<OtpRoute>();
  const { mobileNumber } = route.params;
  const draftPurpose = useRegistrationDraftStore(state => state.purpose);
  const purpose: OtpPurpose = route.params.purpose ?? draftPurpose ?? 'REGISTER';

  const { verifyOtp, isLoading, error, clearError } = useVerifyOtp();
  const { sendOtp, isLoading: isResending } = useSendOtp();
  const { submit, isLoading: isRegistering, error: registerError, clearError: clearRegisterError } =
    useRegister();
  const {
    loginWithOtp,
    isLoading: isOtpLoggingIn,
    error: loginOtpError,
    clearError: clearLoginOtpError,
  } = useLoginWithOtp();
  const otpSentAt = useRegistrationDraftStore(state => state.otpSentAt);
  const expiresIn = useRegistrationDraftStore(state => state.expiresIn);
  const resendAfter = useRegistrationDraftStore(state => state.resendAfter);
  const verificationToken = useRegistrationDraftStore(state => state.verificationToken);
  const tokenExpiresAt = useRegistrationDraftStore(state => state.verificationTokenExpiresAt);
  const clearDraft = useRegistrationDraftStore(state => state.clear);
  const clearVerification = useRegistrationDraftStore(state => state.clearVerification);
  const { deleteAccountByOtp, isDeleting } = useDeleteAccount();
  const showToast = useToastStore(state => state.showToast);
  const fullName = useRegistrationDraftStore(state => state.fullName);
  const password = useRegistrationDraftStore(state => state.password);
  const confirmPassword = useRegistrationDraftStore(state => state.confirmPassword);

  const [otp, setOtp] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletionConfirmed, setDeletionConfirmed] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isComplete = otp.length === 6;
  const tokenOk = isRegistrationTokenValid(verificationToken, tokenExpiresAt);
  const deletionVerified = purpose === 'ACCOUNT_DELETION' && tokenOk;
  const busy = isLoading || isResending || isRegistering || isOtpLoggingIn || isDeleting;
  const bannerError = error || registerError || loginOtpError;
  const canConfirmDelete =
    deletionConfirmed && tokenOk && Boolean(verificationToken) && !isDeleting;

  const otpDeadline = useMemo(
    () => (otpSentAt != null && expiresIn != null ? otpSentAt + expiresIn * 1000 : null),
    [expiresIn, otpSentAt],
  );
  const resendDeadline = useMemo(
    () => (otpSentAt != null && resendAfter != null ? otpSentAt + resendAfter * 1000 : null),
    [otpSentAt, resendAfter],
  );
  const otpRemaining = useCountdown(otpDeadline);
  const resendRemaining = useCountdown(resendDeadline);

  const headerLeft = useCallback(() => <HeaderBackButton />, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.verifyOtp'),
      headerLeft,
      headerBackVisible: false,
    });
  }, [headerLeft, navigation, t, i18n.language]);

  async function handleVerify() {
    Keyboard.dismiss();
    clearError();
    clearRegisterError();
    clearLoginOtpError();
    setInfo(null);
    if (!isComplete) {
      return;
    }
    if (purpose === 'REGISTER' && (!fullName || !password || !confirmPassword)) {
      clearDraft();
      navigation.navigate('Register');
      return;
    }
    const result = await verifyOtp(mobileNumber, otp, purpose);
    if (!result?.verified) {
      return;
    }
    if (purpose === 'LOGIN') {
      await loginWithOtp(mobileNumber, result.verificationToken);
      return;
    }
    if (purpose === 'RESET_PASSWORD') {
      navigation.navigate('ResetPassword');
      return;
    }
    if (purpose === 'ACCOUNT_DELETION') {
      setDeleteError(null);
      setDeletionConfirmed(false);
      setConfirmOpen(true);
      return;
    }
    await submit({
      fullName: fullName ?? '',
      mobileNumber,
      password: password ?? '',
      confirmPassword: confirmPassword ?? '',
      verificationToken: result.verificationToken,
    });
  }

  function openDeletionConfirm() {
    if (!deletionVerified || isDeleting) {
      return;
    }
    Keyboard.dismiss();
    setDeleteError(null);
    setDeletionConfirmed(false);
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    if (!canConfirmDelete || !verificationToken) {
      return;
    }
    setDeleteError(null);
    const result = await deleteAccountByOtp(mobileNumber, verificationToken);
    if (result.ok) {
      clearDraft();
      showToast(t('settings.profile.deleteAccountSuccess'));
      resetToLogin({ accountDeleted: true });
      return;
    }
    setDeleteError(result.error);
    if (result.tokenInvalidated) {
      clearVerification();
    }
  }

  async function handleResend() {
    clearError();
    clearRegisterError();
    clearLoginOtpError();
    setOtp('');
    const result = await sendOtp(mobileNumber, purpose);
    if (result) {
      setInfo(t('auth.otp.resent'));
      Keyboard.dismiss();
    }
  }

  function handleChangeNumber() {
    if (busy) {
      return;
    }
    clearDraft();
    if (purpose === 'LOGIN') {
      navigation.navigate('Login');
      return;
    }
    if (purpose === 'RESET_PASSWORD') {
      navigation.navigate('ForgotPassword');
      return;
    }
    if (purpose === 'ACCOUNT_DELETION') {
      navigation.navigate('DeleteAccount');
      return;
    }
    navigation.navigate('Register');
  }

  const resendLabel =
    resendRemaining > 0
      ? t('auth.otp.resendIn', { time: formatCountdown(resendRemaining) })
      : t('auth.otp.resend');

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <AuthHero
          icon={ShieldCheck}
          eyebrow={t('auth.otp.eyebrow')}
          heading={t('auth.otp.heading')}
          subheading={`${t('auth.otp.subheading')} ${maskIndianMobile(mobileNumber)}`}
        />

        {bannerError ? (
          <View style={styles.errorBanner}>
            <TriangleAlert size={16} color="#B91C1C" strokeWidth={2.2} />
            <Text style={styles.errorBannerText}>{bannerError}</Text>
          </View>
        ) : null}
        {info && !bannerError ? (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>{info}</Text>
          </View>
        ) : null}

        <View style={styles.otpCard}>
          <Text style={styles.otpLabel}>{t('auth.otp.codeLabel')}</Text>
          <OtpInput
            value={otp}
            onChange={value => {
              setOtp(value);
              if (error) {
                clearError();
              }
              if (registerError) {
                clearRegisterError();
              }
              if (loginOtpError) {
                clearLoginOtpError();
              }
              if (info) {
                setInfo(null);
              }
            }}
            disabled={busy || confirmOpen}
          />
          {otpDeadline != null ? (
            <Text style={styles.timerText}>
              {otpRemaining > 0
                ? t('auth.otp.expiresIn', { time: formatCountdown(otpRemaining) })
                : t('auth.otp.expiredHint')}
            </Text>
          ) : null}
          {__DEV__ ? (
            <View style={styles.devHint}>
              <Text style={styles.devHintText}>{t('auth.otp.devHint')}</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          style={({ pressed }) => [styles.changeRow, pressed && styles.changeRowPressed]}
          onPress={handleChangeNumber}
          disabled={busy || confirmOpen}
          accessibilityRole="button"
          accessibilityLabel={t('auth.otp.changeIt')}>
          <Pencil size={14} color={colors.primaryDark} strokeWidth={2.2} />
          <Text style={styles.changeNumber}>
            {t('auth.otp.wrongNumber')}{' '}
            <Text style={styles.changeNumberLink}>{t('auth.otp.changeIt')}</Text>
          </Text>
        </Pressable>
      </ScrollView>

      <StickyFormActions
        primary={{
          label: deletionVerified
            ? t('settings.profile.deleteAccountContinue')
            : t('auth.otp.verifyContinue'),
          onPress: () => {
            if (deletionVerified) {
              openDeletionConfirm();
              return;
            }
            void handleVerify();
          },
          loading: isLoading || isRegistering || isOtpLoggingIn,
          disabled: deletionVerified ? busy : busy || !isComplete,
        }}
        secondary={{
          label: resendLabel,
          onPress: () => {
            handleResend();
          },
          loading: isResending,
          disabled: busy || confirmOpen || resendRemaining > 0,
        }}
      />
      {purpose === 'ACCOUNT_DELETION' ? (
        <DeleteAccountConfirmModal
          visible={confirmOpen}
          confirmed={deletionConfirmed}
          deleting={isDeleting}
          canDelete={canConfirmDelete}
          error={deleteError}
          onConfirmedChange={setDeletionConfirmed}
          onCancel={() => {
            if (!isDeleting) {
              setConfirmOpen(false);
            }
          }}
          onDelete={() => {
            void handleConfirmDelete();
          }}
        />
      ) : null}
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
  infoBanner: {
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoBannerText: {
    ...typography.body,
    color: '#166534',
    fontWeight: '600',
    textAlign: 'center',
  },
  otpCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  otpLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  timerText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  devHint: {
    padding: spacing.sm,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
  },
  devHintText: {
    ...typography.caption,
    color: '#C2410C',
    fontWeight: '600',
    textAlign: 'center',
  },
  changeRow: {
    marginTop: spacing.lg,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  changeRowPressed: {
    opacity: 0.8,
  },
  changeNumber: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  changeNumberLink: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
