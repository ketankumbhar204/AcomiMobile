import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PrepaidBalanceUnit } from '../../api/types';
import { SubscriptionValidTillDateField } from './SubscriptionValidTillDateField';
import { FormInput } from '../ui';
import { colors, spacing, typography } from '../../theme';

type MemberSubscriptionSetupFieldsProps = {
  unit: PrepaidBalanceUnit;
  mealQty: string;
  subscriptionPrice: string;
  validTill: string;
  remarks?: string;
  onMealQtyChange: (value: string) => void;
  onSubscriptionPriceChange: (value: string) => void;
  onValidTillChange: (value: string) => void;
  onRemarksChange?: (value: string) => void;
  mealQtyError?: string;
  subscriptionPriceError?: string;
  validTillError?: string;
  optionalHint?: boolean;
  hideHeader?: boolean;
  useSubscriptionLabels?: boolean;
  showRemarks?: boolean;
  sectionTitle?: string;
  sectionSubtitle?: string;
  mealQtyLabelOverride?: string;
  subscriptionPriceLabelOverride?: string;
  mealQtyPlaceholderOverride?: string;
  subscriptionPricePlaceholderOverride?: string;
};

export function MemberSubscriptionSetupFields({
  unit,
  mealQty,
  subscriptionPrice,
  validTill,
  remarks = '',
  onMealQtyChange,
  onSubscriptionPriceChange,
  onValidTillChange,
  onRemarksChange,
  mealQtyError,
  subscriptionPriceError,
  validTillError,
  optionalHint = false,
  hideHeader = false,
  useSubscriptionLabels = false,
  showRemarks = false,
  sectionTitle,
  sectionSubtitle,
  mealQtyLabelOverride,
  subscriptionPriceLabelOverride,
  mealQtyPlaceholderOverride,
  subscriptionPricePlaceholderOverride,
}: MemberSubscriptionSetupFieldsProps) {
  const { t } = useTranslation();
  const isMealsUnit = unit === 'MEALS';
  const mealLabel = mealQtyLabelOverride
    ? mealQtyLabelOverride
    : useSubscriptionLabels
      ? t('meals.subscription.mealsIncludedLabel')
      : t('members.subscriptionSetup.mealQtyLabel');

  return (
    <View style={styles.wrap}>
      {hideHeader ? null : (
        <>
          <Text style={styles.title}>{t('members.subscriptionSetup.title')}</Text>
          <Text style={styles.subtitle}>
            {optionalHint
              ? t('members.subscriptionSetup.subtitleOptional')
              : t('members.subscriptionSetup.subtitle')}
          </Text>
        </>
      )}

      {sectionTitle ? <Text style={styles.sectionTitle}>{sectionTitle}</Text> : null}
      {sectionSubtitle ? <Text style={styles.sectionSubtitle}>{sectionSubtitle}</Text> : null}

      {isMealsUnit ? (
        <>
          <FormInput
            label={mealLabel}
            placeholder={mealQtyPlaceholderOverride ?? t('members.subscriptionSetup.mealQtyPlaceholder')}
            value={mealQty}
            onChangeText={onMealQtyChange}
            error={mealQtyError}
            keyboardType="number-pad"
          />
          <FormInput
            label={subscriptionPriceLabelOverride ?? t('members.subscriptionSetup.priceLabel')}
            placeholder={
              subscriptionPricePlaceholderOverride ?? t('members.subscriptionSetup.pricePlaceholder')
            }
            value={subscriptionPrice}
            onChangeText={onSubscriptionPriceChange}
            error={subscriptionPriceError}
            keyboardType="decimal-pad"
          />
        </>
      ) : (
        <FormInput
          label={t('members.subscriptionSetup.amountLabel')}
          placeholder={t('members.subscriptionSetup.amountPlaceholder')}
          value={subscriptionPrice}
          onChangeText={onSubscriptionPriceChange}
          error={subscriptionPriceError}
          keyboardType="decimal-pad"
        />
      )}

      <SubscriptionValidTillDateField
        value={validTill}
        onChange={onValidTillChange}
        error={validTillError}
      />

      {showRemarks && onRemarksChange ? (
        <FormInput
          label={t('meals.subscription.remarksLabel')}
          placeholder={t('meals.subscription.remarksPlaceholder')}
          value={remarks}
          onChangeText={onRemarksChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
    paddingLeft: spacing.xs,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
    marginTop: spacing.xxs,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: spacing.xxs,
  },
});
