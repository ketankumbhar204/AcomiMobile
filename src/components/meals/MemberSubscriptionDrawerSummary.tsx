import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberMealBalance, PrepaidBalanceUnit } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import {
  resolveMealsRemaining,
  resolveTotalAmountPaid,
} from '../../utils/subscriptionLifecycle';

type MemberSubscriptionDrawerSummaryProps = {
  subscription: MemberMealBalance | null;
  unit?: PrepaidBalanceUnit;
};

function formatMeals(
  value: number | null | undefined,
  unit: PrepaidBalanceUnit,
  currencyCode: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (value == null) {
    return '—';
  }
  if (unit === 'MEALS') {
    return t('dashboard.financial.mealsCount', { count: Math.round(value) });
  }
  return formatComboPrice(value, currencyCode) ?? '—';
}

export function MemberSubscriptionDrawerSummary({
  subscription,
  unit = 'MEALS',
}: MemberSubscriptionDrawerSummaryProps) {
  const { t } = useTranslation();

  if (!subscription?.lastPurchaseAt) {
    return null;
  }

  const currencyCode = subscription.currencyCode ?? 'INR';
  const mealsRemaining = resolveMealsRemaining(subscription);
  const totalPaid = resolveTotalAmountPaid(subscription);

  return (
    <View style={styles.card}>
      <SummaryRow
        label={t('meals.subscription.summaryCurrentBalance')}
        value={formatMeals(mealsRemaining, unit, currencyCode, t)}
        emphasis
      />
      <View style={styles.divider} />
      <SummaryRow
        label={t('meals.subscription.totalAmountPaidLabel')}
        value={formatComboPrice(totalPaid, currencyCode) ?? '—'}
      />
    </View>
  );
}

function SummaryRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, emphasis && styles.valueEmphasis]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8FAF9',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xxs,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    flex: 1,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
    textAlign: 'right',
  },
  valueEmphasis: {
    color: colors.primaryDark,
    fontSize: 16,
  },
});
