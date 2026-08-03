import React, { useCallback, useLayoutEffect, useState } from 'react';
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
import { StickyFormActions } from '../../components/progressive';
import { HeaderBackButton, OtpInput } from '../../components/ui';
import { useVerifyOtp } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, shadows, spacing, typography } from '../../theme';

type OtpNav = NativeStackNavigationProp<AuthStackParamList, 'OtpVerification'>;
type OtpRoute = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>['route'];

export function OtpScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<OtpNav>();
  const route = useRoute<OtpRoute>();
  const { mobileNumber } = route.params;

  const { verifyOtp, isLoading, error, clearError } = useVerifyOtp();
  const [otp, setOtp] = useState('');

  const isComplete = otp.length === 6;

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

    if (!isComplete) {
      return;
    }

    await verifyOtp(mobileNumber, otp);
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
          icon={ShieldCheck}
          eyebrow={t('auth.otp.eyebrow')}
          heading={t('auth.otp.heading')}
          subheading={`${t('auth.otp.subheading')} +91 ${mobileNumber}`}
        />

        {error ? (
          <View style={styles.errorBanner}>
            <TriangleAlert size={16} color="#B91C1C" strokeWidth={2.2} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.otpCard}>
          <Text style={styles.otpLabel}>
            {t('auth.otp.codeLabel', { defaultValue: '6-digit code' })}
          </Text>
          <OtpInput
            value={otp}
            onChange={value => {
              setOtp(value);
              if (error) {
                clearError();
              }
            }}
            disabled={isLoading}
          />
          {__DEV__ ? (
            <View style={styles.devHint}>
              <Text style={styles.devHintText}>{t('auth.otp.devHint')}</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          style={({ pressed }) => [styles.changeRow, pressed && styles.changeRowPressed]}
          onPress={() => !isLoading && navigation.goBack()}
          disabled={isLoading}
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
          label: t('auth.otp.verifyContinue'),
          onPress: () => void handleVerify(),
          loading: isLoading,
          disabled: isLoading || !isComplete,
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
