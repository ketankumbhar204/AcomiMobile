import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FoodType } from '../../api/types';
import { FOOD_TYPE_OPTIONS, foodTypeLabelKey } from '../../utils/foodType';
import { colors, radius, spacing, typography } from '../../theme';
import { FoodTypeIcon } from './FoodTypeIcon';

type FoodTypePickerProps = {
  value: FoodType;
  onChange: (foodType: FoodType) => void;
  compact?: boolean;
};

export function FoodTypePicker({ value, onChange, compact = false }: FoodTypePickerProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      {!compact ? <Text style={styles.label}>{t('meals.foodType.label')}</Text> : null}
      <View style={styles.row}>
        {FOOD_TYPE_OPTIONS.map(option => {
          const isSelected = value === option;
          return (
            <Pressable
              key={option}
              style={({ pressed }) => [
                styles.chip,
                compact && styles.chipCompact,
                isSelected && styles.chipSelected,
                pressed && !isSelected && styles.chipPressed,
              ]}
              onPress={() => onChange(option)}>
              <FoodTypeIcon foodType={option} size={compact ? 12 : 14} />
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {t(foodTypeLabelKey(option))}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  wrapperCompact: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipCompact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipSelected: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary,
  },
  chipPressed: {
    backgroundColor: colors.surfaceSecondary,
  },
  chipLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chipLabelSelected: {
    color: colors.primaryDark,
  },
});
