import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { colors, pastels, radius, shadows, spacing, typography } from '../../../theme';

export type DashboardActionRowProps = {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  accent?: string;
  badgeCount?: number;
  highlight?: boolean;
  onPress?: () => void;
  disabled?: boolean;
};

/**
 * Design A full-width action row (leading Lucide icon + trailing chevron).
 * Prefer this over emoji ModuleActionCard on Design A surfaces.
 */
export const DashboardActionRow = memo(function DashboardActionRow({
  title,
  subtitle,
  icon: Icon,
  accent = colors.primaryDark,
  badgeCount,
  highlight = false,
  onPress,
  disabled = false,
}: DashboardActionRowProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.card,
        highlight && styles.cardHighlight,
        disabled && styles.cardDisabled,
        pressed && !disabled && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={title}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: highlight ? pastels.orange.bg : `${accent}18` },
          disabled && styles.iconWrapDisabled,
        ]}>
        <Icon size={18} color={highlight ? pastels.orange.fg : accent} strokeWidth={2.2} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, disabled && styles.titleDisabled]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, disabled && styles.subtitleDisabled]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {!disabled && badgeCount != null && badgeCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : String(badgeCount)}</Text>
        </View>
      ) : null}
      {!disabled ? <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} /> : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 64,
    ...shadows.sm,
  },
  cardHighlight: {
    borderColor: pastels.orange.border,
    backgroundColor: pastels.orange.bg,
  },
  cardDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.85,
  },
  cardPressed: {
    opacity: 0.92,
    borderColor: `${colors.primary}66`,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDisabled: {
    backgroundColor: colors.border,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  titleDisabled: {
    color: colors.muted,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  subtitleDisabled: {
    color: colors.muted,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
});