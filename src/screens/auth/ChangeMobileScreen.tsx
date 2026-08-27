import React, { useEffect, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Smartphone, TriangleAlert } from 'lucide-react-native';
import { AuthHero } from '../../components/auth';
import { StickyFormActions } from '../../components/progressive';
import { useAuthenticatedUser, useSendOtp } from '../../hooks/useAuth';
import { useOtpCooldown } from '../../hooks/useOtpCooldown';
import type { MainStackParamList } from '../../navigation/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import {
  isValidIndianMobile,
  maskIndianMobile,
  normalizeIndianMobileDigits,
} from '../../utils/indianMobile';
import { formatCountdown } from '../../utils/otpAuthErrors';

type ChangeMobileNav = NativeStackNavigationProp<MainStackParamList, 'ChangeMobile'>;

export function ChangeMobileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<ChangeMobileNav>();
  const user = useAuthenticatedUser();
  const { sendOtp, isLoading, error, clearError } = useSendOtp();
  const currentMobile = normalizeIndianMobileDigits(user?.mobileNumber ?? '');
  const [mobileNumber, setMobileNumber] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const bannerError = localError || error;
  const nextMobile = normalizeIndianMobileDigits(mobileNumber);
  const cooldown = useOtpCooldown(nextMobile, 'CHANGE_MOBILE');
  const canSubmit =
    isValidIndianMobile(nextMobile) &&
    nextMobile !== currentMobile &&
    !isLoading &&
    cooldown === 0;

  useEffect(() => {
    navigation.setOptions({ title: t('auth.changeMobile.heading') });
  }, [navigation, t]);

  async function handleSubmit() {
    Keyboard.dismiss();
    clearError();
    setLocalError(null);
    if (!isValidIndianMobile(nextMobile)) {
      setLocalError(
        mobileNumber.trim() ? t('auth.login.mobileInvalid') : t('auth.login.mobileRequired'),
      );
      return;
    }
    if (nextMobile === currentMobile) {
      setLocalError(t('auth.changeMobile.sameNumber'));
      return;
    }
    const result = await sendOtp(nextMobile, 'CHANGE_MOBILE');
    if (result) {
      navigation.navigate('ChangeMobileOtp', {
        mobileNumber: nextMobile,
        purpose: 'CHANGE_MOBILE',
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
          icon={Smartphone}
          eyebrow={t('auth.changeMobile.eyebrow')}
          heading={t('auth.changeMobile.heading')}
          subheading={t('auth.changeMobile.subheading')}
        />

        {bannerError ? (
          <View style={styles.errorBanner}>
            <TriangleAlert size={16} color="#B91C1C" strokeWidth={2.2} />
            <Text style={styles.errorBannerText}>{bannerError}</Text>
          </View>
        ) : null}

        {currentMobile ? (
          <View style={styles.currentCard}>
            <ShieldCheck size={14} color={colors.primaryDark} strokeWidth={2.2} />
            <Text style={styles.currentText}>
              {t('auth.changeMobile.currentLabel')} {maskIndianMobile(currentMobile)}
            </Text>
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
                localError ? styles.phoneInputError : null,
              ]}
              placeholder={t('auth.login.mobilePlaceholder')}
              placeholderTextColor={colors.muted}
              value={mobileNumber}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChangeText={text => {
                setMobileNumber(normalizeIndianMobileDigits(text));
                if (localError) {
                  setLocalError(null);
                }
                if (error) {
                  clearError();
                }
              }}
              keyboardType="phone-pad"
              maxLength={10}
              autoCorrect={false}
              editable={!isLoading}
              accessibilityLabel={t('auth.login.mobileLabel')}
            />
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}
          onPress={() => navigation.navigate('Profile')}
          accessibilityRole="button">
          <Text style={styles.linkText}>{t('auth.changeMobile.backToProfile')}</Text>
        </Pressable>
      </ScrollView>

      <StickyFormActions
        primary={{
          label:
            cooldown > 0
              ? t('auth.otp.sendOtpIn', { time: formatCountdown(cooldown) })
              : t('auth.changeMobile.sendOtp'),
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
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  currentText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
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
