import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type ModuleActionCardProps = {
  title: string;
  subtitle?: string;
  Icon?: LucideIcon;
  onPress?: () => void;
  disabled?: boolean;
  comingSoonLabel?: string;
  badgeCount?: number;
  trailing?: 'expand' | 'forward';
  highlight?: boolean;
  fullWidth?: boolean;
};

export function ModuleActionCard({
  title,
  subtitle,
  Icon,
  onPress,
  disabled = false,
  comingSoonLabel,
  badgeCount,
  trailing = 'expand',
  highlight = false,
  fullWidth = false,
}: ModuleActionCardProps) {
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.72}
      style={[
        styles.card,
        fullWidth && styles.cardFullWidth,
        highlight && styles.cardHighlight,
        disabled && styles.cardDisabled,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}>
      {Icon ? (
        <View style={[styles.iconWrap, disabled && styles.iconWrapDisabled, highlight && styles.iconWrapHighlight]}>
          <Icon size={18} color={highlight ? '#D97706' : colors.primaryDark} strokeWidth={2.2} />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text style={[styles.title, disabled && styles.titleDisabled]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, disabled && styles.subtitleDisabled]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {comingSoonLabel ? <Text style={styles.comingSoon}>{comingSoonLabel}</Text> : null}
      </View>
      {!disabled && badgeCount != null && badgeCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount}</Text>
        </View>
      ) : null}
      {!disabled ? (
        trailing === 'forward' ? (
          <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
        ) : (
          <ChevronDown size={18} color={colors.muted} strokeWidth={2.4} />
        )
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 88,
    ...shadows.sm,
  },
  cardFullWidth: {
    flex: 0,
    width: '100%',
  },
  cardDisabled: {
    backgroundColor: colors.surfaceSecondary,
    opacity: 0.85,
  },
  cardPressed: {
    borderColor: `${colors.primary}66`,
    backgroundColor: colors.hover,
  },
  cardHighlight: {
    borderColor: '#F59E0B',
    backgroundColor: colors.warningTint,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: colors.successTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDisabled: {
    backgroundColor: colors.border,
  },
  iconWrapHighlight: {
    backgroundColor: '#FEF3C7',
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  titleDisabled: {
    color: colors.muted,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  subtitleDisabled: {
    color: colors.muted,
  },
  comingSoon: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    marginTop: 4,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
});
