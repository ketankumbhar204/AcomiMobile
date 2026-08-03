import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export type SegmentedTabItem<T extends string> = {
  key: T;
  label: string;
  icon?: LucideIcon;
};

type SegmentedTabsProps<T extends string> = {
  items: SegmentedTabItem<T>[];
  value: T;
  onChange: (key: T) => void;
  compact?: boolean;
  style?: object;
};

/** Material-style segmented control used across list and detail screens. */
export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  compact = false,
  style,
}: SegmentedTabsProps<T>) {
  return (
    <View
      style={[styles.wrap, compact && styles.wrapCompact, style]}
      accessibilityRole="tablist">
      {items.map(item => {
        const isActive = item.key === value;
        const Icon = item.icon;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            android_ripple={{ color: 'rgba(18, 140, 126, 0.08)', borderless: true }}
            style={({ pressed }) => [
              styles.tab,
              compact && styles.tabCompact,
              isActive && styles.tabActive,
              pressed && !isActive && styles.tabPressed,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={item.label}>
            {Icon ? (
              <Icon
                size={compact ? 14 : 16}
                color={isActive ? colors.primaryDark : colors.muted}
                strokeWidth={2.2}
              />
            ) : null}
            <Text
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.button,
    padding: spacing.xs,
    gap: spacing.xxs,
  },
  wrapCompact: {
    padding: 2,
    gap: 2,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.button,
  },
  tabCompact: {
    minHeight: 40,
    paddingHorizontal: spacing.xs,
    gap: spacing.xxs,
  },
  tabActive: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  tabPressed: {
    opacity: 0.7,
  },
  label: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    textAlign: 'center',
    flexShrink: 1,
  },
  labelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
