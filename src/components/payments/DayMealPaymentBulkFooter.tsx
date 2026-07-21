import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';

type DayMealPaymentBulkFooterProps = {
  selectedCount: number;
  totalAmount: number;
  currencyCode: string;
  disabled?: boolean;
  onPaySelected: () => void;
};

export function DayMealPaymentBulkFooter({
  selectedCount,
  totalAmount,
  currencyCode,
  disabled = false,
  onPaySelected,
}: DayMealPaymentBulkFooterProps) {
  const { t } = useTranslation();
  if (selectedCount <= 0) {
    return null;
  }

  const amountLabel = formatComboPrice(totalAmount, currencyCode) ?? '—';

  return (
    <View style={styles.wrap}>
      <View style={styles.meta}>
        <Text style={styles.selected}>
          {t('paymentCollection.dayMeals.bulk.selected', { count: selectedCount })}
        </Text>
        <Text style={styles.amount}>{amountLabel}</Text>
      </View>
      <Pressable
        style={[styles.button, disabled && styles.buttonDisabled]}
        disabled={disabled}
        onPress={onPaySelected}
        accessibilityRole="button">
        <Text style={styles.buttonLabel}>{t('paymentCollection.dayMeals.bulk.paySelected')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selected: {
    ...typography.bodyStrong,
  },
  amount: {
    ...typography.h3,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    ...typography.bodyStrong,
    color: colors.white,
  },
});
