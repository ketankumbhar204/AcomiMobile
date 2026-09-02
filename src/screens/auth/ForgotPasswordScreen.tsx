import React, { useState } from 'react';
import {
  Keyboard,
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
import { KeyRound, Smartphone, TriangleAlert } from 'lucide-react-native';
import { AuthHero } from '../../components/auth';
import { StickyFormActions } from '../../components/progressive';
import { useSendOtp } from '../../hooks/useAuth';
import { useOtpCooldown } from '../../hooks/useOtpCooldown';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '../../utils/indianMobile';
import { formatCountdown } from '../../utils/otpAuthErrors';

type ForgotNav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ForgotNav>();
  const { sendOtp, isLoading, error, clearError } = useSendOtp();
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const cooldown = useOtpCooldown(mobileNumber, 'RESET_PASSWORD');
  const canSubmit = isValidIndianMobile(mobileNumber) && !isLoading && cooldown === 0;

  async function handleSubmit() {
    Keyboard.dismiss();
    clearError();
    if (!mobileNumber.trim()) {
      setMobileError(t('auth.login.mobileRequired'));
      return;
    }
    if (!isValidIndianMobile(mobileNumber)) {
      setMobileError(t('auth.login.mobileInvalid'));
      return;
    }
    const result = await sendOtp(mobileNumber, 'RESET_PASSWORD');
    if (result) {
      navigation.navigate('OtpVerification', {
        mobileNumber,
        purpose: 'RESET_PASSWORD',
      });
    }
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
          heading={t('auth.forgotPassword.heading')}
          subheading={t('auth.forgotPassword.subheading')}
        />

        {error ? (
          <View style={styles.errorBanner}>
            <TriangleAlert size={16} color="#B91C1C" strokeWidth={2.2} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
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
                styles.phoneInput,
                focused && styles.phoneInputFocused,
                mobileError ? styles.phoneInputError : null,
              ]}
              placeholder={t('auth.login.mobilePlaceholder')}
              placeholderTextColor={colors.muted}
              value={mobileNumber}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
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
              autoCorrect={false}
              accessibilityLabel={t('auth.login.mobileLabel')}
            />
          </View>
          {mobileError ? <Text style={styles.fieldError}>{mobileError}</Text> : null}
        </View>

        <Pressable
          style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button">
          <Text style={styles.linkText}>{t('auth.forgotPassword.backToSignIn')}</Text>
        </Pressable>
      </ScrollView>

      <StickyFormActions
        primary={{
          label:
            cooldown > 0
              ? t('auth.otp.sendOtpIn', { time: formatCountdown(cooldown) })
              : t('auth.forgotPassword.submit'),
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
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
