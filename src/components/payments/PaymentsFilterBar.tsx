import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PaymentLedgerFilter } from '../../hooks/usePaymentsLedger';
import { colors, radius, spacing, typography } from '../../theme';

type PaymentsFilterBarProps = {
  filter: PaymentLedgerFilter;
  onFilterChange: (filter: PaymentLedgerFilter) => void;
  counts: { all: number; pending: number; collected: number };
};

const FILTERS: PaymentLedgerFilter[] = ['all', 'pending', 'collected'];

export function PaymentsFilterBar({ filter, onFilterChange, counts }: PaymentsFilterBarProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.row}>
      {FILTERS.map(item => {
        const active = filter === item;
        const count = counts[item];
        return (
          <Pressable
            key={item}
            onPress={() => onFilterChange(item)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}>
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
              {t(`payments.filters.${item}`, { count })}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
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
});
