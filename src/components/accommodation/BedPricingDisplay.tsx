import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import { formatPricingMoney } from '../../utils/commitBedPricing';

type BedPricingDisplayProps = {
  rent?: number | null;
  deposit?: number | null;
  layout?: 'row' | 'stack' | 'inline';
  /**
   * When showing an occupancy pricing snapshot (not catalog defaults),
   * pass stayKind so Daily / open-ended rates are not labeled as monthly.
   */
  stayKind?: 'MONTHLY' | 'SHORT' | 'OPEN_ENDED' | null;
};

export function BedPricingDisplay({
  rent,
  deposit,
  layout = 'stack',
  stayKind = null,
}: BedPricingDisplayProps) {
  const { t } = useTranslation();
  const notSet = t('accommodation.pricingConfirm.notSet', { defaultValue: 'Not set' });
  const stacked = layout === 'stack';
  const inline = layout === 'inline';
  const rentLabel =
    stayKind === 'SHORT'
      ? t('occupancy.contract.dailyRentPerNight', { defaultValue: 'Daily rent (per night)' })
      : stayKind === 'OPEN_ENDED'
        ? t('occupancy.contract.dailyRent', { defaultValue: 'Daily rent' })
        : t('accommodation.fields.rent', { defaultValue: 'Monthly rent' });
  const rentValue =
    stayKind === 'SHORT' && rent != null
      ? `${formatPricingMoney(rent, notSet)} / night`
      : stayKind === 'OPEN_ENDED' && rent != null
        ? `${formatPricingMoney(rent, notSet)} / day`
        : formatPricingMoney(rent, notSet);
  const depositLabel = t('accommodation.fields.deposit', { defaultValue: 'Deposit' });
  const depositValue = formatPricingMoney(deposit, notSet);

  if (inline) {
    return (
      <View
        style={styles.inlineWrap}
        accessibilityRole="text"
        accessibilityLabel={`${rentLabel} ${rentValue}, ${depositLabel} ${depositValue}`}>
        <Text style={styles.inlineLine} numberOfLines={1}>
          {`${rentLabel}: ${rentValue}`}
        </Text>
        <Text style={styles.inlineLine} numberOfLines={1}>
          {`${depositLabel}: ${depositValue}`}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.wrap, stacked ? styles.stack : styles.row]}
      accessibilityRole="text"
      accessibilityLabel={`${rentLabel} ${rentValue}, ${depositLabel} ${depositValue}`}>
      <View style={[styles.item, stacked ? styles.itemStack : styles.itemRow]}>
        <Text style={styles.label}>{rentLabel}</Text>
        <Text style={styles.value}>{rentValue}</Text>
      </View>
      <View style={[styles.item, stacked ? styles.itemStack : styles.itemRow]}>
        <Text style={styles.label}>{depositLabel}</Text>
        <Text style={styles.value}>{depositValue}</Text>
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
  inlineWrap: {
    width: '100%',
    gap: 2,
  },
  inlineLine: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 11,
    lineHeight: 15,
  },
});
