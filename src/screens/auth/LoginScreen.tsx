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
import { Button } from '../../components/ui';
import { useSendOtp } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, radius, spacing, typography } from '../../theme';
import { isValidIndianMobile, normalizeIndianMobileDigits } from '../../utils/indianMobile';

type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<LoginNav>();
  const { sendOtp, isLoading, error, clearError } = useSendOtp();

  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileError, setMobileError] = useState<string | null>(null);

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
          paddingBottom: insets.bottom,
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

        <Text style={styles.heading}>{t('auth.login.heading')}</Text>
        <Text style={styles.subheading}>{t('auth.login.subheading')}</Text>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.phoneField}>
          <View style={styles.inputRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={[styles.phoneInput, fieldError ? styles.phoneInputError : null]}
              placeholder={t('auth.login.mobilePlaceholder')}
              placeholderTextColor={colors.muted}
              value={mobileNumber}
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
            />
          </View>
          {fieldError ? <Text style={styles.fieldError}>{fieldError}</Text> : null}
        </View>

        <Button
          label={t('auth.login.sendOtp')}
          onPress={handleSendOtp}
          loading={isLoading}
          disabled={isLoading || !isValid}
          style={styles.button}
        />

        <Text style={styles.disclaimer}>{t('auth.login.disclaimer')}</Text>
      </ScrollView>
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
    padding: spacing.xxl,
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.section,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
  heading: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subheading: {
    ...typography.body,
    marginBottom: spacing.xxl,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    ...typography.body,
    color: '#DC2626',
  },
  phoneField: {
    marginBottom: spacing.lg,
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
    backgroundColor: colors.white,
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
    fontSize: 15,
    color: colors.textPrimary,
    ...(Platform.OS === 'android' ? { textAlignVertical: 'center' as const } : null),
  },
  phoneInputError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  fieldError: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xs,
  },
  button: {
    marginTop: 0,
  },
  disclaimer: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.textSecondary,
  },
});
