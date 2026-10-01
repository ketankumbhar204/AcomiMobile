import React, { type ComponentType } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export type ButtonTint = {
  bg: string;
  border: string;
  fg: string;
};

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  /** Soft pastel fill + matching label. Overrides variant colors. */
  tint?: ButtonTint;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  /** Optional Lucide leading icon. */
  icon?: ComponentType<IconProps>;
  accessibilityLabel?: string;
  numberOfLines?: number;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  tint,
  loading = false,
  disabled = false,
  style,
  icon: Icon,
  accessibilityLabel,
  numberOfLines,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const iconColor =
    tint?.fg ?? (variant === 'primary' ? colors.white : colors.primaryDark);
  const spinnerColor =
    tint?.fg ?? (variant === 'primary' ? colors.white : colors.primary);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      android_ripple={{ color: 'rgba(0,0,0,0.08)' }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        tint && {
          backgroundColor: tint.bg,
          borderWidth: 1,
          borderColor: tint.border,
        },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <>
          <ActivityIndicator color={spinnerColor} />
          <Text
            numberOfLines={numberOfLines}
            style={[
              styles.label,
              styles[`${variant}Label`],
              tint && { color: tint.fg },
            ]}>
            {label}
          </Text>
        </>
      ) : (
        <>
          {Icon ? <Icon size={18} color={iconColor} strokeWidth={2.3} /> : null}
          <Text
            numberOfLines={numberOfLines}
            style={[
              styles.label,
              styles[`${variant}Label`],
              tint && { color: tint.fg },
            ]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  ghost: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.bodyStrong,
    fontSize: 15,
  },
  primaryLabel: {
    color: colors.white,
  },
  secondaryLabel: {
    color: colors.primaryDark,
  },
  ghostLabel: {
    color: colors.textPrimary,
  },
});
