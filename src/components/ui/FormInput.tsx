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
};

export function FormInput({ label, error, hint, style, ...inputProps }: FormInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
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
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
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
