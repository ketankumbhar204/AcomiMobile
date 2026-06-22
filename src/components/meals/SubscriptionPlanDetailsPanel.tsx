import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SubscriptionPlanResponse } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';

type SubscriptionPlanDetailsPanelProps = {
  plan: SubscriptionPlanResponse;
};

export function SubscriptionPlanDetailsPanel({ plan }: SubscriptionPlanDetailsPanelProps) {
  const { t } = useTranslation();
  const priceLabel = formatComboPrice(plan.price, plan.currencyCode) ?? '—';
  const unusedPolicy = plan.carryForwardUnused
    ? t('meals.subscriptionPlans.carryForward')
    : t('meals.subscriptionPlans.expireUnused');

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{t('meals.subscription.customer.planDetailsTitle')}</Text>
      <DetailRow label={t('meals.subscriptionPlans.nameLabel')} value={plan.name} />
      <DetailRow
        label={t('meals.subscriptionPlans.mealsLabel')}
        value={t('meals.subscriptionPlans.mealsLine', { count: plan.mealsIncluded })}
      />
      <DetailRow label={t('meals.subscriptionPlans.priceLabel')} value={priceLabel} />
      <DetailRow
        label={t('meals.subscriptionPlans.validityLabel')}
        value={t('meals.subscriptionPlans.validityLine', { days: plan.validityDays })}
      />
      <DetailRow label={t('meals.subscriptionPlans.unusedMealsLabel')} value={unusedPolicy} />
      {plan.description ? (
        <DetailRow label={t('meals.subscriptionPlans.descriptionLabel')} value={plan.description} multiline />
      ) : null}
    </View>
  );
}

function DetailRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, multiline && styles.rowValueMultiline]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.white,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    marginBottom: spacing.xxs,
  },
  row: {
    gap: 2,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontSize: 11,
  },
  rowValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  rowValueMultiline: {
    lineHeight: 20,
  },
});
