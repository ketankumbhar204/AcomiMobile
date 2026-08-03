import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { radius, spacing, typography } from '../../theme';
import { getPaymentStatusIcon } from '../../utils/billingVisuals';
import {
  getPaymentStatusLabelKey,
  getPaymentStatusTheme,
  resolvePaymentStatusVariant,
  type PaymentStatusSource,
} from '../../utils/paymentStatusTheme';

type PaymentStatusBadgeProps = {
  status: PaymentStatusSource | null | undefined;
  label?: string;
  style?: ViewStyle;
  /** When true, show a neutral badge for unknown/NONE instead of hiding. */
  showNeutral?: boolean;
};

export function PaymentStatusBadge({
  status,
  label,
  style,
  showNeutral = false,
}: PaymentStatusBadgeProps) {
  const { t } = useTranslation();
  const variant = resolvePaymentStatusVariant(status);
  if (variant === 'neutral' && !showNeutral) {
    return null;
  }

  const theme = getPaymentStatusTheme(status);
  const displayLabel = label ?? t(getPaymentStatusLabelKey(status));
  const Icon = getPaymentStatusIcon(variant);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={displayLabel}>
      <Icon size={12} color={theme.accent} strokeWidth={2.4} />
      <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexShrink: 0,
    gap: spacing.xs,
    borderWidth: 1.5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    maxWidth: '100%',
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    flexShrink: 1,
  },
});
