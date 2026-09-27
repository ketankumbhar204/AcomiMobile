import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react-native';
import { MenuDatePickerModal } from '../meals/MenuDatePickerModal';
import { colors, radius, spacing, typography } from '../../theme';
import { formatMenuDate, todayIsoDate } from '../../utils/mealDates';

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  optional?: boolean;
  allowPastDates?: boolean;
  error?: string;
};

export function DateField({
  label,
  value,
  onChange,
  placeholder,
  optional = false,
  allowPastDates = true,
  error,
}: DateFieldProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? value.trim() : '';
  const display = iso
    ? formatMenuDate(iso, i18n.language)
    : placeholder ?? t('common.selectDate', { defaultValue: 'Select date' });

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [
          styles.input,
          error ? styles.inputError : null,
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.value, !iso && styles.placeholder]} numberOfLines={1}>
          {display}
        </Text>
        <CalendarDays size={18} color={colors.primaryDark} strokeWidth={2.2} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <MenuDatePickerModal
        visible={open}
        value={iso || todayIsoDate()}
        allowPastDates={allowPastDates}
        onClose={() => setOpen(false)}
        onConfirm={next => {
          onChange(next);
          setOpen(false);
        }}
      />
      {optional && iso ? (
        <Pressable onPress={() => onChange('')} hitSlop={6} style={styles.clearBtn}>
          <Text style={styles.clearLabel}>
            {t('common.clear', { defaultValue: 'Clear' })}
          </Text>
        </Pressable>
      ) : null}
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
  pressed: {
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  value: {
    flex: 1,
    ...typography.body,
    fontSize: 15,
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.muted,
  },
  error: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xs,
  },
  clearBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  clearLabel: {
    ...typography.caption,
    color: colors.info,
    fontWeight: '600',
  },
});
