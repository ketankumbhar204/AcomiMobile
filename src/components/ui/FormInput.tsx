import React, { type ComponentType } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

type FormInputProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
  size?: 'default' | 'compact';
  /** Optional Lucide (or compatible) leading icon. */
  leadingIcon?: ComponentType<IconProps>;
  prefix?: string;
};

export function FormInput({
  label,
  error,
  hint,
  size = 'default',
  leadingIcon: LeadingIcon,
  prefix,
  style,
  ...inputProps
}: FormInputProps) {
  const compact = size === 'compact';

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      {label ? (
        <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputWrap,
          compact && styles.inputWrapCompact,
          error ? styles.inputWrapError : null,
        ]}>
        {LeadingIcon ? (
          <View style={styles.leadingIcon}>
            <LeadingIcon
              size={compact ? 16 : 18}
              color={colors.primaryDark}
              strokeWidth={2.2}
            />
          </View>
        ) : null}
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          style={[styles.input, compact && styles.inputCompact, style]}
          placeholderTextColor={colors.muted}
          autoCorrect={false}
          {...inputProps}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hintText}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  wrapperCompact: {
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  labelCompact: {
    marginBottom: spacing.xxs,
  },
  inputWrap: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  inputWrapCompact: {
    minHeight: 40,
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
  },
  inputWrapError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  leadingIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefix: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputCompact: {
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xs,
  },
  hintText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
