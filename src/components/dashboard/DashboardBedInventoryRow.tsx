import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

type DashboardBedInventoryRowProps = {
  label: string;
  onPress: () => void;
};

export function DashboardBedInventoryRow({ label, onPress }: DashboardBedInventoryRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button">
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    gap: spacing.sm,
  },
  rowPressed: {
    backgroundColor: colors.surface,
  },
  label: {
    flex: 1,
    ...typography.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
    color: colors.muted,
  },
});
