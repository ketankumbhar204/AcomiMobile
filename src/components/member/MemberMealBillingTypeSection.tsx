import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealBillingType } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';

export type MemberMealBillingSelection = MealBillingType | 'DEFAULT';

type MemberMealBillingTypeSectionProps = {
  spaceDefault: MealBillingType;
  value: MemberMealBillingSelection;
  onChange: (value: MemberMealBillingSelection) => void;
  disabled?: boolean;
  embedded?: boolean;
};

const BILLING_TYPES: MealBillingType[] = ['PAY_PER_MEAL', 'PREPAID_BALANCE'];

function isOptionSelected(
  option: MealBillingType,
  value: MemberMealBillingSelection,
  spaceDefault: MealBillingType,
): boolean {
  if (value === option) {
    return true;
  }
  return value === 'DEFAULT' && option === spaceDefault;
}

function optionLabel(
  option: MealBillingType,
  spaceDefault: MealBillingType,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const base = t(`spaces.mealBilling.types.${option}.label`);
  if (option === spaceDefault) {
    return t('members.mealBilling.typeWithDefault', { type: base });
  }
  return base;
}

export function MemberMealBillingTypeSection({
  spaceDefault,
  value,
  onChange,
  disabled = false,
  embedded = false,
}: MemberMealBillingTypeSectionProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.wrap, embedded && styles.wrapEmbedded]}>
      <Text style={styles.title}>{t('members.mealBilling.title')}</Text>
      <Text style={styles.subtitle}>{t('members.mealBilling.subtitle')}</Text>
      <View style={styles.options}>
        {BILLING_TYPES.map(option => {
          const selected = isOptionSelected(option, value, spaceDefault);
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option === spaceDefault ? 'DEFAULT' : option)}
              disabled={disabled}
              style={[
                styles.option,
                selected && styles.optionSelected,
                disabled && styles.optionDisabled,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: Boolean(disabled) }}>
              <View style={styles.optionHeader}>
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                  {optionLabel(option, spaceDefault, t)}
                </Text>
              </View>
              <Text style={styles.optionDescription}>
                {t(`spaces.mealBilling.types.${option}.description`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  wrapEmbedded: {
    marginBottom: 0,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
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
    color: colors.textPrimary,
    flex: 1,
  },
  optionLabelSelected: {
    color: colors.primaryDark,
  },
  optionDescription: {
    ...typography.caption,
    color: colors.muted,
    marginLeft: 26,
    lineHeight: 18,
  },
});
