import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';

/** Matches the fixed 2factor OTP SMS body (OTP masked). */
export const OTP_SMS_SAMPLE_BODY =
  '[Hello] Your OTP for Phone Verification is XXXXXX. Valid for 5 mins - [Southern Express]';

/**
 * Sample SMS card so users recognize the provider template as ACOMI's OTP.
 * "Southern Express" is the 2factor placeholder — not a different product.
 */
export function OtpSmsSample() {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap} accessibilityLabel={t('auth.otp.smsSampleA11y')}>
      <View style={styles.titleRow}>
        <MessageSquare size={14} color={colors.teal} strokeWidth={2.2} />
        <Text style={styles.title}>{t('auth.otp.smsSampleTitle')}</Text>
      </View>

      <View style={styles.bubble}>
        <Text style={styles.sender}>{t('auth.otp.smsSampleSender')}</Text>
        <Text style={styles.body}>{t('auth.otp.smsSampleBody')}</Text>
      </View>

      <Text style={styles.caption}>{t('auth.otp.smsSampleCaption')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  bubble: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: 6,
    maxWidth: '100%',
  },
  sender: {
    ...typography.caption,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  body: {
    ...typography.body,
    color: '#F9FAFB',
    lineHeight: 22,
  },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
