import React, { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Pencil, type LucideIcon } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../../theme';

export type DashboardSectionHeaderProps = {
  title: string;
  icon: LucideIcon;
  /** Accent used for soft header tint + icon circle (Design A). */
  accent?: string;
  actionLabel?: string;
  onAction?: () => void;
  trailing?: ReactNode;
};

/**
 * Design A section header — soft tinted bar, icon circle, optional edit action.
 * Shared by Owner Dashboard surfaces and Quick Setup Preview.
 */
export const DashboardSectionHeader = memo(function DashboardSectionHeader({
  title,
  icon: Icon,
  accent = colors.primaryDark,
  actionLabel,
  onAction,
  trailing,
}: DashboardSectionHeaderProps) {
  return (
    <View style={[styles.wrap, { backgroundColor: `${accent}14` }]}>
      <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}>
        <Icon size={16} color={accent} strokeWidth={2.2} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {trailing}
      {onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
          accessibilityRole="button"
          accessibilityLabel={actionLabel ?? title}>
          <Pencil size={14} color={accent} strokeWidth={2.2} />
          {actionLabel ? <Text style={[styles.actionLabel, { color: accent }]}>{actionLabel}</Text> : null}
        </Pressable>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.card,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.bodyStrong,
    flex: 1,
    color: colors.textPrimary,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionPressed: {
    opacity: 0.75,
  },
  actionLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
});
