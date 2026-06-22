import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberSubscriptionLifetimeSummary, PrepaidBalanceUnit } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';

type MemberSubscriptionHistorySummaryProps = {
  summary: MemberSubscriptionLifetimeSummary | null;
  unit?: PrepaidBalanceUnit;
  currencyCode?: string;
};

function formatMealsCount(
  amount: number | null | undefined,
  unit: PrepaidBalanceUnit,
  currencyCode: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (amount == null) {
    return '—';
  }
  if (unit === 'MEALS') {
    return t('dashboard.financial.mealsCount', { count: Math.round(amount) });
  }
  return formatComboPrice(amount, currencyCode) ?? '—';
}

export function MemberSubscriptionHistorySummary({
  summary,
  unit = 'MEALS',
  currencyCode = 'INR',
}: MemberSubscriptionHistorySummaryProps) {
  const { t } = useTranslation();

  if (!summary) {
    return null;
  }

  const totalPaid =
    formatComboPrice(summary.totalAmountPaid ?? null, currencyCode) ?? '—';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('meals.subscription.historySummaryTitle')}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>{t('meals.subscription.historyTotalPurchased')}</Text>
        <Text style={styles.value}>
          {formatMealsCount(summary.totalMealsPurchased, unit, currencyCode, t)}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{t('meals.subscription.historyTotalConsumed')}</Text>
        <Text style={styles.value}>
          {formatMealsCount(summary.totalMealsConsumed, unit, currencyCode, t)}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{t('meals.subscription.historyTotalPaid')}</Text>
        <Text style={styles.value}>{totalPaid}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{t('meals.subscription.historyTotalActivities')}</Text>
        <Text style={styles.value}>
          {summary.totalActivities != null ? String(summary.totalActivities) : '—'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    fontSize: 12,
    flex: 1,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
    textAlign: 'right',
  },
});
