import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

type FormInputProps = TextInputProps & {
  label: string;
  error?: string | null;
  hint?: string;
  size?: 'default' | 'compact';
};

export function FormInput({
  label,
  error,
  hint,
  size = 'default',
  style,
  ...inputProps
}: FormInputProps) {
  const compact = size === 'compact';

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      {label ? (
        <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
      ) : null}
      <TextInput
        style={[
          styles.input,
          compact && styles.inputCompact,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={colors.muted}
        autoCorrect={false}
        {...inputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hintText}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  wrapperCompact: {
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  labelCompact: {
    marginBottom: spacing.xxs,
  },
  input: {
    minHeight: 48,
    backgroundColor: colors.white,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputCompact: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    borderRadius: radius.button,
  },
  inputError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
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
