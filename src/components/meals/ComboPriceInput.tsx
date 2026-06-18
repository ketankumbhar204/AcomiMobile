import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';

type ComboPriceInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
};

export function ComboPriceInput({ value, onChangeText, error }: ComboPriceInputProps) {
  const { t } = useTranslation();

  return (
    <View>
      <Text style={styles.label}>{t('meals.pricing.priceOptionalLabel')}</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <Text style={styles.currency}>₹</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder={t('meals.pricing.pricePlaceholder')}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  inputRowError: {
    borderColor: '#DC2626',
  },
  currency: { ...typography.bodyStrong, marginRight: spacing.xs },
  input: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.md,
  },
  error: { ...typography.caption, color: '#DC2626', marginTop: spacing.xxs },
});
