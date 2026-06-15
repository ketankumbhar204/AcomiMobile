import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MealPollOption } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';

type MealPollOptionRadioProps = {
  option: MealPollOption;
  selected: boolean;
  onSelect: () => void;
};

export function MealPollOptionRadio({ option, selected, onSelect }: MealPollOptionRadioProps) {
  const isNotAvailable = option.optionType === 'NOT_AVAILABLE';

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
        <Text style={[styles.label, isNotAvailable && styles.labelMuted]}>
          {option.sortOrder}. {option.label}
        </Text>
        {option.detail ? <Text style={styles.detail}>{option.detail}</Text> : null}
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
    padding: spacing.md,
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
    gap: spacing.xs,
  },
  label: {
    ...typography.bodyStrong,
  },
  labelMuted: {
    color: colors.muted,
    fontWeight: '600',
  },
  detail: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
