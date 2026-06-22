import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealBillingType, PrepaidBalanceUnit } from '../../api/types';
import { Card } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';

export type MealBillingSettingsFormValues = {
  billingType: MealBillingType;
  prepaidBalanceUnit: PrepaidBalanceUnit;
  fallbackToPayPerMeal: boolean;
};

type MealBillingSettingsSectionProps = {
  values: MealBillingSettingsFormValues;
  onChange: (values: MealBillingSettingsFormValues) => void;
  disabled?: boolean;
};

const BILLING_TYPES: MealBillingType[] = ['PAY_PER_MEAL', 'PREPAID_BALANCE'];
const PREPAID_UNITS: PrepaidBalanceUnit[] = ['MEALS', 'CURRENCY'];

function BillingOption({
  label,
  description,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.option, selected && styles.optionSelected, disabled && styles.optionDisabled]}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: Boolean(disabled) }}>
      <View style={styles.optionHeader}>
        <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
          {selected ? <View style={styles.radioInner} /> : null}
        </View>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
      </View>
      <Text style={styles.optionDescription}>{description}</Text>
    </Pressable>
  );
}

function UnitChip({
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
      style={[styles.chip, selected && styles.chipActive, disabled && styles.optionDisabled]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: Boolean(disabled) }}>
      <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export function MealBillingSettingsSection({
  values,
  onChange,
  disabled = false,
}: MealBillingSettingsSectionProps) {
  const { t } = useTranslation();
  const isPrepaid = values.billingType === 'PREPAID_BALANCE';

  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>{t('spaces.mealBilling.title')}</Text>
      <Text style={styles.sectionSubtitle}>{t('spaces.mealBilling.subtitle')}</Text>

      <View style={styles.options}>
        {BILLING_TYPES.map(type => (
          <BillingOption
            key={type}
            label={t(`spaces.mealBilling.types.${type}.label`)}
            description={t(`spaces.mealBilling.types.${type}.description`)}
            selected={values.billingType === type}
            disabled={disabled}
            onPress={() =>
              onChange({
                ...values,
                billingType: type,
                prepaidBalanceUnit:
                  type === 'PREPAID_BALANCE' ? values.prepaidBalanceUnit ?? 'MEALS' : values.prepaidBalanceUnit,
              })
            }
          />
        ))}
      </View>

      {isPrepaid ? (
        <>
          <Text style={styles.unitLabel}>{t('spaces.mealBilling.balanceUnitLabel')}</Text>
          <View style={styles.chipRow}>
            {PREPAID_UNITS.map(unit => (
              <UnitChip
                key={unit}
                label={t(`spaces.mealBilling.units.${unit}`)}
                selected={values.prepaidBalanceUnit === unit}
                disabled={disabled}
                onPress={() => onChange({ ...values, prepaidBalanceUnit: unit })}
              />
            ))}
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchLabel}>{t('spaces.mealBilling.fallbackLabel')}</Text>
              <Text style={styles.switchHint}>{t('spaces.mealBilling.fallbackHint')}</Text>
            </View>
            <Switch
              value={values.fallbackToPayPerMeal}
              onValueChange={fallbackToPayPerMeal =>
                onChange({ ...values, fallbackToPayPerMeal })
              }
              disabled={disabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.muted,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  optionLabel: {
    ...typography.bodyStrong,
    flex: 1,
  },
  optionLabelSelected: {
    color: colors.primaryDark,
  },
  optionDescription: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
    paddingLeft: 26,
  },
  unitLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.primaryDark,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  switchText: {
    flex: 1,
    gap: spacing.xxs,
  },
  switchLabel: {
    ...typography.bodyStrong,
  },
  switchHint: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
  },
});
