import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberMealBalance, PrepaidBalanceUnit } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';

type MemberSubscriptionSummaryCardProps = {
  subscription: MemberMealBalance | null;
  loading?: boolean;
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

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StatCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
    </View>
  );
}

export function MemberSubscriptionSummaryCard({
  subscription,
  loading = false,
}: MemberSubscriptionSummaryCardProps) {
  const { t, i18n } = useTranslation();

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!subscription?.lastPurchaseAt) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>{t('meals.subscription.currentTitle')}</Text>
        <Text style={styles.empty}>{t('meals.subscription.noSubscription')}</Text>
      </View>
    );
  }

  const unit = subscription.unit ?? 'MEALS';
  const currencyCode = subscription.currencyCode ?? 'INR';
  const mealsIncluded = formatMealsCount(subscription.mealsIncluded, unit, currencyCode, t);
  const mealsUsed = formatMealsCount(subscription.mealsUsed, unit, currencyCode, t);
  const mealsRemaining = formatMealsCount(
    subscription.mealsRemaining ?? subscription.balance,
    unit,
    currencyCode,
    t,
  );
  const amountPaid =
    formatComboPrice(subscription.lastPurchasePaidAmount ?? null, currencyCode) ?? '—';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('meals.subscription.currentTitle')}</Text>
      <View style={styles.row}>
        <StatCell label={t('meals.subscription.mealsIncluded')} value={mealsIncluded} highlight />
        <StatCell label={t('meals.subscription.mealsUsed')} value={mealsUsed} />
        <StatCell
          label={t('meals.subscription.mealsRemainingShort')}
          value={mealsRemaining}
          highlight
        />
      </View>
      <View style={styles.row}>
        <StatCell label={t('meals.subscription.amountPaidLabel')} value={amountPaid} />
        <StatCell
          label={t('meals.subscription.validTillLabel')}
          value={formatDate(subscription.validTill, i18n.language)}
        />
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
    gap: spacing.sm,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 14,
  },
  empty: {
    ...typography.caption,
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statCell: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  statValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontSize: 13,
    textAlign: 'center',
  },
  statValueHighlight: {
    color: colors.primaryDark,
  },
});
