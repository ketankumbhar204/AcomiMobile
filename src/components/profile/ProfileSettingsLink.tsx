import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type ProfileSettingsLinkProps = {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  onPress: () => void;
  /** Danger marks a destructive destination without turning the row into a filled CTA. */
  tone?: 'default' | 'danger';
  /** `embedded` sits inside a settings card. `card` is its own tappable surface. */
  variant?: 'embedded' | 'card';
  disabled?: boolean;
  accessibilityHint?: string;
  testID?: string;
};

/**
 * Quiet settings row. Used for account deletion and privacy so those
 * destinations stay findable without sitting on top of Log out.
 */
export function ProfileSettingsLink({
  title,
  subtitle,
  icon: Icon,
  onPress,
  tone = 'default',
  variant = 'card',
  disabled = false,
  accessibilityHint,
  testID,
}: ProfileSettingsLinkProps) {
  const iconColor = tone === 'danger' ? colors.danger : colors.primaryDark;
  const iconBackground = tone === 'danger' ? colors.errorTint : colors.lightGreen;
  const hint = [subtitle, accessibilityHint].filter(Boolean).join(' ');

  return (
    <Pressable
      testID={testID}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={hint || undefined}
      accessibilityState={{ disabled }}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      style={({ pressed }) => [
        styles.row,
        variant === 'card' ? styles.card : styles.embedded,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
        <Icon size={18} color={iconColor} strokeWidth={2.2} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, tone === 'danger' && styles.titleDanger]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <ChevronRight size={18} color={colors.muted} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  embedded: {
    marginHorizontal: -spacing.md,
    marginVertical: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  titleDanger: {
    color: colors.danger,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
