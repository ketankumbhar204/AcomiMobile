import React, { useLayoutEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Button, HeaderBackButton, OtpInput } from '../../components/ui';
import { useVerifyOtp } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.verifyOtp'),
      headerLeft: () => <HeaderBackButton />,
      headerBackVisible: false,
    });
  }, [navigation, t, i18n.language]);

  async function handleVerify() {
    Keyboard.dismiss();
    clearError();

    if (!isComplete) {
      return;
    }

    await verifyOtp(mobileNumber, otp);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <Text style={styles.eyebrow}>{t('auth.otp.eyebrow')}</Text>
          <Text style={styles.heading}>{t('auth.otp.heading')}</Text>
          <Text style={styles.subheading}>
            {t('auth.otp.subheading')}{' '}
            <Text style={styles.mobile}>+91 {mobileNumber}</Text>
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

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

          <Button
            label={t('auth.otp.verifyContinue')}
            onPress={handleVerify}
            loading={isLoading}
            disabled={isLoading || !isComplete}
            style={styles.button}
          />

          <Text style={styles.changeNumber}>
            {t('auth.otp.wrongNumber')}{' '}
            <Text
              style={styles.changeNumberLink}
              onPress={() => !isLoading && navigation.goBack()}>
              {t('auth.otp.changeIt')}
            </Text>
          </Text>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: spacing.sm,
  },
  heading: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subheading: {
    ...typography.body,
    marginBottom: spacing.xxl,
  },
  mobile: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
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
  devHint: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
  },
  devHintText: {
    ...typography.caption,
    color: '#C2410C',
    fontWeight: '600',
  },
  button: {
    marginTop: spacing.xxl,
  },
  changeNumber: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.textSecondary,
  },
  changeNumberLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
