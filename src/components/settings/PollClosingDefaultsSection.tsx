import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PollCloseDayOffset } from '../../api/types';
import { Card } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import type { MealType } from '../../api/types';

export type PollClosingDefaultsFormValues = {
  timezone: string;
  breakfastDayOffset: PollCloseDayOffset;
  breakfastTime: string;
  lunchDayOffset: PollCloseDayOffset;
  lunchTime: string;
  dinnerDayOffset: PollCloseDayOffset;
  dinnerTime: string;
};

type PollClosingDefaultsSectionProps = {
  values: PollClosingDefaultsFormValues;
  onChange: (values: PollClosingDefaultsFormValues) => void;
  disabled?: boolean;
};

const OFFSETS: PollCloseDayOffset[] = ['PREVIOUS_DAY', 'SAME_DAY'];

function OffsetChip({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.chip, selected && styles.chipActive, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: Boolean(disabled) }}>
      <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function MealCloseRow({
  title,
  dayOffset,
  time,
  onOffsetChange,
  onTimeChange,
  disabled,
}: {
  title: string;
  dayOffset: PollCloseDayOffset;
  time: string;
  onOffsetChange: (offset: PollCloseDayOffset) => void;
  onTimeChange: (time: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.mealBlock}>
      <Text style={styles.mealTitle}>{title}</Text>
      <Text style={styles.fieldLabel}>{t('meals.pollClosing.dayOffset')}</Text>
      <View style={styles.chipRow}>
        {OFFSETS.map(offset => (
          <OffsetChip
            key={offset}
            label={t(`meals.pollClosing.offsets.${offset}`)}
            selected={dayOffset === offset}
            onPress={() => onOffsetChange(offset)}
            disabled={disabled}
          />
        ))}
      </View>
      <Text style={styles.fieldLabel}>{t('meals.pollClosing.time')}</Text>
      <TextInput
        style={styles.timeInput}
        value={time}
        onChangeText={onTimeChange}
        placeholder="HH:mm"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
      />
    </View>
  );
}

export function PollClosingDefaultsSection({
  values,
  onChange,
  disabled = false,
}: PollClosingDefaultsSectionProps) {
  const { t } = useTranslation();

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{t('meals.pollClosing.title')}</Text>
      <Text style={styles.subtitle}>{t('meals.pollClosing.subtitle')}</Text>

      <Text style={styles.fieldLabel}>{t('meals.pollClosing.timezone')}</Text>
      <TextInput
        style={styles.timeInput}
        value={values.timezone}
        onChangeText={timezone => onChange({ ...values, timezone })}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!disabled}
      />

      <MealCloseRow
        title={t(mealTypeLabelKey('BREAKFAST' as MealType))}
        dayOffset={values.breakfastDayOffset}
        time={values.breakfastTime}
        onOffsetChange={breakfastDayOffset => onChange({ ...values, breakfastDayOffset })}
        onTimeChange={breakfastTime => onChange({ ...values, breakfastTime })}
        disabled={disabled}
      />
      <MealCloseRow
        title={t(mealTypeLabelKey('LUNCH' as MealType))}
        dayOffset={values.lunchDayOffset}
        time={values.lunchTime}
        onOffsetChange={lunchDayOffset => onChange({ ...values, lunchDayOffset })}
        onTimeChange={lunchTime => onChange({ ...values, lunchTime })}
        disabled={disabled}
      />
      <MealCloseRow
        title={t(mealTypeLabelKey('DINNER' as MealType))}
        dayOffset={values.dinnerDayOffset}
        time={values.dinnerTime}
        onOffsetChange={dinnerDayOffset => onChange({ ...values, dinnerDayOffset })}
        onTimeChange={dinnerTime => onChange({ ...values, dinnerTime })}
        disabled={disabled}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  title: {
    ...typography.h3,
  },
  subtitle: {
    ...typography.caption,
    marginTop: -spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  mealBlock: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mealTitle: {
    ...typography.bodyStrong,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  chipLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.primaryDark,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    backgroundColor: colors.surface,
  },
  disabled: {
    opacity: 0.55,
  },
});
