import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MealPollOption } from '../../api/types';
import { FoodTypeIcon } from '../ui/FoodTypeIcon';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';

type MealPollOptionRadioProps = {
  option: MealPollOption;
  selected: boolean;
  onSelect: () => void;
  readOnly?: boolean;
  showPrice?: boolean;
};

export function MealPollOptionRadio({
  option,
  selected,
  onSelect,
  readOnly = false,
  showPrice = true,
}: MealPollOptionRadioProps) {
  const isNotAvailable = option.optionType === 'NOT_AVAILABLE';
  const priceLabel = showPrice ? formatComboPrice(option.price, option.currencyCode) : null;

  return (
    <Pressable
      style={[
        styles.row,
        isNotAvailable && styles.rowMuted,
        selected && readOnly && styles.rowSelectedReadOnly,
        readOnly && styles.rowReadOnly,
      ]}
      onPress={readOnly ? undefined : onSelect}
      disabled={readOnly}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: readOnly }}>
      <View
        style={[
          styles.radio,
          readOnly && styles.radioReadOnly,
          selected && !readOnly && styles.radioSelected,
          selected && readOnly && styles.radioSelectedReadOnly,
        ]}>
        {selected ? (
          <View style={[styles.radioDot, readOnly && styles.radioDotReadOnly]} />
        ) : null}
      </View>
      <View style={styles.content}>
        <View style={styles.mainLine}>
          {!isNotAvailable && option.foodType ? (
            <FoodTypeIcon foodType={option.foodType} size={14} style={styles.foodTypeIcon} />
          ) : null}
          <Text
            style={[
              styles.label,
              isNotAvailable && styles.labelMuted,
              readOnly && styles.labelReadOnly,
            ]}
            numberOfLines={1}>
            {option.sortOrder}. {option.label}
          </Text>
          {priceLabel ? (
            <Text style={[styles.price, readOnly && styles.priceReadOnly]}>{priceLabel}</Text>
          ) : null}
        </View>
        {option.detail ? (
          <Text style={[styles.detail, readOnly && styles.detailReadOnly]} numberOfLines={2}>
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
  rowSelectedReadOnly: {
    backgroundColor: colors.surface,
  },
  rowReadOnly: {
    opacity: 1,
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
  radioReadOnly: {
    borderColor: colors.muted,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioSelectedReadOnly: {
    borderColor: colors.muted,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  radioDotReadOnly: {
    backgroundColor: colors.muted,
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
  foodTypeIcon: {
    flexShrink: 0,
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
  priceReadOnly: {
    color: colors.muted,
  },
  labelMuted: {
    color: colors.muted,
    fontWeight: '600',
  },
  labelReadOnly: {
    color: colors.textSecondary,
  },
  detail: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  detailReadOnly: {
    color: colors.muted,
  },
});
