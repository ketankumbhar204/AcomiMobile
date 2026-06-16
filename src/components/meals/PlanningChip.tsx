import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export type PlanningChipVariant = 'COMBO' | 'ITEM';

type PlanningChipProps = {
  label: string;
  variant: PlanningChipVariant;
  onPress?: () => void;
  onRemove?: () => void;
};

export function PlanningChip({ label, variant, onPress, onRemove }: PlanningChipProps) {
  return (
    <View
      style={[
        styles.chip,
        variant === 'COMBO' ? styles.chipCombo : styles.chipItem,
        !onRemove && styles.chipReadOnly,
      ]}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={styles.chipLabelHit}
        hitSlop={onPress ? 4 : 0}>
        <Text style={styles.chipText} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8} style={styles.chipRemove}>
          <Text style={styles.chipRemoveText}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    maxWidth: '100%',
  },
  chipCombo: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  chipItem: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  chipReadOnly: {
    paddingRight: spacing.md,
  },
  chipLabelHit: {
    flexShrink: 1,
    minWidth: 0,
  },
  chipText: { ...typography.caption, color: colors.textPrimary, fontWeight: '600' },
  chipRemove: { padding: spacing.xxs },
  chipRemoveText: { fontSize: 14, color: colors.muted, fontWeight: '700' },
});
