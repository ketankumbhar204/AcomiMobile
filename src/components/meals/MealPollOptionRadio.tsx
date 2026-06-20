import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MealPollOption } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';

type MealPollOptionRadioProps = {
  option: MealPollOption;
  selected: boolean;
  onSelect: () => void;
};

export function MealPollOptionRadio({ option, selected, onSelect }: MealPollOptionRadioProps) {
  const isNotAvailable = option.optionType === 'NOT_AVAILABLE';
  const priceLabel = formatComboPrice(option.price, option.currencyCode);

  return (
    <Pressable
      style={[styles.row, isNotAvailable && styles.rowMuted]}
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.content}>
        <View style={styles.mainLine}>
          <Text style={[styles.label, isNotAvailable && styles.labelMuted]} numberOfLines={1}>
            {option.sortOrder}. {option.label}
          </Text>
          {priceLabel ? <Text style={styles.price}>{priceLabel}</Text> : null}
        </View>
        {option.detail ? (
          <Text style={styles.detail} numberOfLines={2}>
            {option.detail}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowMuted: {
    backgroundColor: colors.surface,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  mainLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 24,
  },
  label: {
    ...typography.bodyStrong,
    flex: 1,
    minWidth: 0,
  },
  price: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  labelMuted: {
    color: colors.muted,
    fontWeight: '600',
  },
  detail: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
