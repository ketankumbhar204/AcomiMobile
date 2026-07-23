import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export type ListFilterChipOption<T extends string> = {
  id: T;
  label: string;
  badge?: number;
  /** Accent when active — defaults to primary green. */
  tone?: 'primary' | 'warning' | 'info' | 'danger';
};

type ListFilterChipsProps<T extends string> = {
  options: ListFilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

const TONE = {
  primary: {
    border: colors.primary,
    bg: colors.lightGreen,
    text: colors.primaryDark,
    badgeBg: colors.primary,
  },
  warning: {
    border: '#F97316',
    bg: '#FFF7ED',
    text: '#C2410C',
    badgeBg: '#F97316',
  },
  info: {
    border: '#2563EB',
    bg: '#EFF6FF',
    text: '#1D4ED8',
    badgeBg: '#2563EB',
  },
  danger: {
    border: '#EF4444',
    bg: '#FEF2F2',
    text: '#B91C1C',
    badgeBg: '#EF4444',
  },
} as const;

export function ListFilterChips<T extends string>({
  options,
  value,
  onChange,
}: ListFilterChipsProps<T>) {
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {options.map(option => {
          const active = option.id === value;
          const tone = TONE[option.tone ?? 'primary'];
          const showBadge = typeof option.badge === 'number';
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange(option.id)}
              style={[
                styles.chip,
                {
                  borderColor: tone.border,
                  backgroundColor: tone.bg,
                },
                active && styles.chipActive,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}>
              <Text style={[styles.chipLabel, { color: tone.text, fontWeight: active ? '700' : '600' }]}>
                {option.label}
              </Text>
              {showBadge ? (
                <View style={[styles.badge, { backgroundColor: tone.badgeBg }]}>
                  <Text style={[styles.badgeText, { color: colors.white }]}>{option.badge}</Text>
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
    gap: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipActive: {
    borderWidth: 1.5,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
});
