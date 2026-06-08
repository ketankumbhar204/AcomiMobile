import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

type BadgeProps = {
  label: string;
  showDot?: boolean;
};

export function Badge({ label, showDot = true }: BadgeProps) {
  return (
    <View style={styles.badge}>
      {showDot && <View style={styles.dot} />}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primaryDark,
  },
});
