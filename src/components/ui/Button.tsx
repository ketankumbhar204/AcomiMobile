import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.white : colors.primary}
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
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
