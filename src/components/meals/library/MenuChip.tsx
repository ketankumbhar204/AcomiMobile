import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../../theme';

export type MenuChipVariant = 'filter' | 'item' | 'add' | 'combo';
export type MenuChipSize = 'default' | 'compact';

type MenuChipProps = {
  label: string;
  variant?: MenuChipVariant;
  size?: MenuChipSize;
  selected?: boolean;
  isCustom?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
};

export function MenuChip({
  label,
  variant = 'filter',
  size = 'default',
  selected = false,
  isCustom = false,
  onPress,
  onLongPress,
  style,
}: MenuChipProps) {
  const isAdd = variant === 'add';
  const isSelected =
    selected && (variant === 'filter' || variant === 'combo' || variant === 'item');
  const isCompact = size === 'compact';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
      style={({ pressed }) => [
        styles.base,
        isCompact && styles.compact,
        isAdd && styles.add,
        isSelected && styles.selected,
        variant === 'item' && isCustom && styles.customItem,
        pressed && styles.pressed,
        style,
      ]}>
      <Text
        style={[
          styles.label,
          isCompact && styles.compactLabel,
          isAdd && styles.addLabel,
          isSelected && styles.selectedLabel,
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    maxWidth: '100%',
  },
  compact: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  compactLabel: {
    fontSize: 12,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  customItem: {
    borderColor: `${colors.primary}55`,
    backgroundColor: colors.surface,
  },
  add: {
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  selectedLabel: {
    color: colors.primaryDark,
  },
  addLabel: {
    color: colors.primaryDark,
  },
});
