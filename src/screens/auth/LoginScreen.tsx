import React, { useState } from 'react';
import {
  Keyboard,
  Platform,
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
import { LogIn, Smartphone, TriangleAlert } from 'lucide-react-native';
import { AuthHero } from '../../components/auth';
import { StickyFormActions } from '../../components/progressive';
import type { AuthStackParamList } from '../../navigation/types';
import { useSendOtp } from '../../hooks/useAuth';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '../../utils/indianMobile';

type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LoginNav>();
  const { sendOtp, isLoading, error, clearError } = useSendOtp();

  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const isValid = isValidIndianMobile(mobileNumber);
  const formatError =
    mobileNumber.length === 10 && !isValid ? t('auth.login.mobileInvalid') : null;

  function validateMobile(value: string): string | null {
    if (!value.trim()) {
      return t('auth.login.mobileRequired');
    }
    if (!isValidIndianMobile(value)) {
      return t('auth.login.mobileInvalid');
    }
    return null;
  }

  const fieldError = mobileError ?? formatError;

  async function handleSendOtp() {
    Keyboard.dismiss();
    clearError();

    const validationError = validateMobile(mobileNumber);
    if (validationError) {
      setMobileError(validationError);
      return;
    }

    const success = await sendOtp(mobileNumber);
    if (success) {
      navigation.navigate('OtpVerification', { mobileNumber });
    }
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

        {error ? (
          <View style={styles.errorBanner}>
            <TriangleAlert size={16} color="#B91C1C" strokeWidth={2.2} />
            <Text style={styles.errorBannerText}>{error}</Text>
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
                focused && styles.phoneInputFocused,
                fieldError ? styles.phoneInputError : null,
              ]}
              placeholder={t('auth.login.mobilePlaceholder')}
              placeholderTextColor={colors.muted}
              value={mobileNumber}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChangeText={text => {
                const digits = normalizeIndianMobileDigits(text);
                setMobileNumber(digits);
                if (mobileError) {
                  setMobileError(null);
                }
                if (error) {
                  clearError();
                }
              }}
              keyboardType="phone-pad"
              returnKeyType="done"
              maxLength={10}
              onSubmitEditing={handleSendOtp}
              autoCorrect={false}
              accessibilityLabel={t('auth.login.mobileLabel', {
                defaultValue: 'Mobile number',
              })}
            />
          </View>
          {fieldError ? <Text style={styles.fieldError}>{fieldError}</Text> : null}
          <Text style={styles.helper}>
            {t('auth.login.mobileHelper', {
              defaultValue: 'We will text a 6-digit code. Standard SMS rates may apply.',
            })}
          </Text>
        </View>

        <Text style={styles.disclaimer}>{t('auth.login.disclaimer')}</Text>
      </ScrollView>

      <StickyFormActions
        primary={{
          label: t('auth.login.sendOtp'),
          onPress: () => void handleSendOtp(),
          loading: isLoading,
          disabled: isLoading || !isValid,
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
  },
  disclaimer: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.lg,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
