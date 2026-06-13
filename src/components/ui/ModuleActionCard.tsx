import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type ModuleActionCardProps = {
  title: string;
  subtitle?: string;
  icon?: string;
  onPress?: () => void;
  disabled?: boolean;
  comingSoonLabel?: string;
};

export function ModuleActionCard({
  title,
  subtitle,
  icon,
  onPress,
  disabled = false,
  comingSoonLabel,
}: ModuleActionCardProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        disabled && styles.cardDisabled,
        pressed && !disabled && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled }}>
      {icon ? (
        <View style={[styles.iconWrap, disabled && styles.iconWrapDisabled]}>
          <Text style={styles.icon}>{icon}</Text>
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
      {!disabled ? <Text style={styles.chevron}>▾</Text> : null}
    </Pressable>
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
  cardDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.85,
  },
  cardPressed: {
    borderColor: `${colors.primary}66`,
    backgroundColor: colors.surface,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDisabled: {
    backgroundColor: colors.border,
  },
  icon: {
    fontSize: 18,
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
  chevron: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
});
