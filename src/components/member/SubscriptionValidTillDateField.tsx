import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MenuDatePickerModal } from '../meals/MenuDatePickerModal';
import { colors, radius, spacing, typography } from '../../theme';
import { formatMenuDate } from '../../utils/mealDates';
import { defaultSubscriptionValidTillIso } from '../../utils/subscriptionLifecycle';

type SubscriptionValidTillDateFieldProps = {
  value: string;
  onChange: (isoDate: string) => void;
  error?: string;
  allowPastDates?: boolean;
};

function resolveDateValue(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  return defaultSubscriptionValidTillIso();
}

export function SubscriptionValidTillDateField({
  value,
  onChange,
  error,
  allowPastDates = false,
}: SubscriptionValidTillDateFieldProps) {
  const { t, i18n } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const dateValue = resolveDateValue(value);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{t('meals.subscription.validTillLabel')}</Text>
      <Pressable
        onPress={() => setPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('meals.subscription.validTillLabel')}
        accessibilityHint={t('meals.planning.openCalendar')}
        style={({ pressed }) => [
          styles.input,
          error ? styles.inputError : null,
          pressed && styles.inputPressed,
        ]}>
        <Text style={styles.valueText}>{formatMenuDate(dateValue, i18n.language)}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <MenuDatePickerModal
        visible={pickerOpen}
        value={dateValue}
        allowPastDates={allowPastDates}
        onClose={() => setPickerOpen(false)}
        onConfirm={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  inputPressed: {
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  valueText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    ...typography.body,
  },
  chevron: {
    ...typography.bodyStrong,
    color: colors.muted,
    fontSize: 16,
  },
  error: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xs,
  },
});
