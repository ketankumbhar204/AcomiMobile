import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { DailyMenuOptionResponse } from '../../api/types';
import { colors, spacing, typography } from '../../theme';
import { formatComboNameWithPrice, formatComboPrice } from '../../utils/comboPrice';

type PlannedComboPreviewRowProps = {
  option: DailyMenuOptionResponse;
  itemNames: string[];
  price?: number | null;
  currencyCode?: string | null;
  onPress: () => void;
};

export function PlannedComboPreviewRow({
  option,
  itemNames,
  price,
  currencyCode = 'INR',
  onPress,
}: PlannedComboPreviewRowProps) {
  const priceLabel = formatComboPrice(price, currencyCode);
  const displayName = formatComboNameWithPrice(option.label, price, currencyCode);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrapper, pressed && styles.wrapperPressed]}
      accessibilityRole="button"
      accessibilityLabel={
        itemNames.length > 0
          ? `${displayName}, ${itemNames.join(', ')}`
          : displayName
      }>
      <Text style={styles.choiceDot}>·</Text>
      <Text style={styles.comboName} numberOfLines={1}>
        {option.label}
      </Text>
      {priceLabel ? (
        <Text style={styles.price} numberOfLines={1}>
          {priceLabel}
        </Text>
      ) : null}
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
    borderRadius: 6,
    marginLeft: -spacing.xxs,
    paddingLeft: spacing.xxs,
    paddingRight: spacing.xxs,
    paddingVertical: 2,
  },
  wrapperPressed: {
    backgroundColor: colors.surface,
  },
  choiceDot: {
    ...typography.body,
    color: colors.muted,
    lineHeight: 20,
  },
  comboName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  price: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  chevron: {
    ...typography.body,
    color: colors.muted,
    fontSize: 18,
    lineHeight: 20,
    paddingLeft: spacing.xs,
  },
});
