import React from 'react';
import { StyleSheet, Text, type TextStyle, type StyleProp } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography } from '../../theme';
import {
  resolvePaymentReferenceDisplay,
  type PaymentReferenceSource,
} from '../../utils/paymentReference';

type PaymentReferenceLabelProps = {
  source: PaymentReferenceSource | null | undefined;
  /** Compact single-line label for cards (default). */
  compact?: boolean;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

/**
 * High-contrast payment reference for list cards and detail headers.
 * Returns null when no displayable reference exists.
 */
export function PaymentReferenceLabel({
  source,
  compact = true,
  style,
  numberOfLines = 1,
}: PaymentReferenceLabelProps) {
  const { t } = useTranslation();
  const reference = resolvePaymentReferenceDisplay(source);
  if (!reference) {
    return null;
  }

  return (
    <Text
      style={[styles.label, compact ? styles.compact : styles.detail, style]}
      numberOfLines={numberOfLines}
      accessibilityRole="text"
      accessibilityLabel={t('paymentCollection.dayMeals.paymentReference', { id: reference })}>
      {t('paymentCollection.dayMeals.paymentReference', { id: reference })}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  compact: {
    color: colors.textPrimary,
  },
  detail: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
});
