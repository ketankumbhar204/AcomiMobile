import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import { formatPricingMoney } from '../../utils/commitBedPricing';

type BedPricingDisplayProps = {
  rent?: number | null;
  deposit?: number | null;
  layout?: 'row' | 'stack';
};

export function BedPricingDisplay({
  rent,
  deposit,
  layout = 'stack',
}: BedPricingDisplayProps) {
  const { t } = useTranslation();
  const notSet = t('accommodation.pricingConfirm.notSet', { defaultValue: 'Not set' });
  const stacked = layout === 'stack';

  return (
    <View
      style={[styles.wrap, stacked ? styles.stack : styles.row]}
      accessibilityRole="text"
      accessibilityLabel={`${t('accommodation.fields.rent')} ${formatPricingMoney(rent, notSet)}, ${t('accommodation.fields.deposit')} ${formatPricingMoney(deposit, notSet)}`}>
      <View style={[styles.item, stacked ? styles.itemStack : styles.itemRow]}>
        <Text style={styles.label}>{t('accommodation.fields.rent')}</Text>
        <Text style={styles.value}>{formatPricingMoney(rent, notSet)}</Text>
      </View>
      <View style={[styles.item, stacked ? styles.itemStack : styles.itemRow]}>
        <Text style={styles.label}>{t('accommodation.fields.deposit')}</Text>
        <Text style={styles.value}>{formatPricingMoney(deposit, notSet)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  stack: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  item: {
    minWidth: 0,
  },
  itemStack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemRow: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  value: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
