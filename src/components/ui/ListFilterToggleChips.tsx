import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { toggleSetValue } from '../../utils/filterCount';

export type ListFilterToggleChipOption<T extends string> = {
  id: T;
  label: string;
  swatchColor?: string;
  count?: number;
};

type ListFilterToggleChipsProps<T extends string> = {
  options: readonly ListFilterToggleChipOption<T>[];
  selected: Set<T>;
  onChange: (selected: Set<T>) => void;
};

export function ListFilterToggleChips<T extends string>({
  options,
  selected,
  onChange,
}: ListFilterToggleChipsProps<T>) {
  const isChipActive = (id: T) => selected.size === 0 || selected.has(id);

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {options.map(option => {
          const active = isChipActive(option.id);
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange(toggleSetValue(selected, option.id))}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={
                option.count != null ? `${option.label}, ${option.count}` : option.label
              }>
              {option.swatchColor ? (
                <View style={[styles.swatch, { backgroundColor: option.swatchColor }]} />
              ) : null}
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                {option.label}
              </Text>
              {option.count != null ? (
                <View style={[styles.countBadge, active && styles.countBadgeActive]}>
                  <Text style={[styles.countText, active && styles.countTextActive]}>
                    {option.count}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.primaryDark,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  countBadgeActive: {
    backgroundColor: colors.white,
  },
  countText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  countTextActive: {
    color: colors.primaryDark,
  },
});
