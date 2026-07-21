import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import { PAYMENT_STATUS_THEME } from '../../utils/paymentStatusTheme';

type PaymentNeedsUpdatePanelProps = {
  ownerRequest?: string | null;
  /** Customers get the resubmit CTA; owners see the request read-only. */
  showCta?: boolean;
  onUpdatePress?: () => void;
};

const theme = PAYMENT_STATUS_THEME.needsUpdate;

/**
 * Compact UPDATE_REQUESTED callout: why, what, next action.
 * Reuses existing submit-proof handlers — no separate payment flow.
 */
export function PaymentNeedsUpdatePanel({
  ownerRequest,
  showCta = true,
  onUpdatePress,
}: PaymentNeedsUpdatePanelProps) {
  const { t } = useTranslation();
  const reason = ownerRequest?.trim() || null;

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.title}>
        ⚠ {t('paymentCollection.needsUpdate.actionRequired')}
      </Text>
      <Text style={styles.hint}>{t('paymentCollection.updateRequestedHint')}</Text>

      {reason ? (
        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>{t('paymentCollection.needsUpdate.reason')}</Text>
          <Text style={styles.reasonText}>{reason}</Text>
        </View>
      ) : null}

      {showCta && onUpdatePress ? (
        <Button
          label={t('paymentCollection.needsUpdate.updateProofCta')}
          onPress={onUpdatePress}
          style={styles.cta}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    backgroundColor: theme.background,
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: theme.text,
    fontSize: 16,
  },
  hint: {
    ...typography.body,
    color: theme.text,
    lineHeight: 22,
  },
  reasonBox: {
    backgroundColor: colors.white,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: `${theme.border}88`,
    padding: spacing.md,
    gap: spacing.xs,
  },
  reasonLabel: {
    ...typography.caption,
    color: theme.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  reasonText: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  cta: {
    marginTop: spacing.xs,
  },
});
