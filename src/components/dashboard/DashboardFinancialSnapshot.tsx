import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  IndianRupee,
  Inbox,
  Wallet,
} from 'lucide-react-native';
import type { DashboardFinancialSummary } from '../../api/types';
import { colors, spacing } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import { DashboardSectionTitle } from './DashboardSectionTitle';
import { DashboardStatCard } from './shared/DashboardStatCard';

type DashboardFinancialSnapshotProps = {
  loading: boolean;
  financial: DashboardFinancialSummary | null;
  title?: string;
  /** When true, always render This month cards (show —) even if all amounts are null. */
  alwaysShow?: boolean;
  onExpectedPress?: () => void;
  onCollectedPress?: () => void;
  onUnderReviewPress?: () => void;
  onPendingPress?: () => void;
};

const ACCENT = {
  expected: colors.primaryDark,
  collected: colors.success,
  underReview: '#2563EB',
  pending: '#D97706',
} as const;

export function DashboardFinancialSnapshot({
  loading,
  financial,
  title,
  alwaysShow = false,
  onExpectedPress,
  onCollectedPress,
  onUnderReviewPress,
  onPendingPress,
}: DashboardFinancialSnapshotProps) {
  const { t } = useTranslation();
  const currencyCode = financial?.currencyCode ?? 'INR';
  const mixed = financial?.mixedMealBilling === true;
  const prepaidOnly =
    financial?.mealBillingType === 'PREPAID_BALANCE' && !mixed;
  const prepaid = financial?.prepaidBalance;
  const hasPayPerMealAmounts =
    financial?.expectedCharges != null ||
    financial?.collected != null ||
    financial?.underReview != null ||
    financial?.pending != null;
  const hasPrepaidAmounts =
    prepaid?.balanceSold != null ||
    prepaid?.balanceConsumed != null ||
    prepaid?.balanceRemaining != null ||
    prepaid?.amountCollected != null;
  // Owner dashboards always keep This month visible (show — when empty).
  // Prepaid Mess spaces keep prepaid cards; others use expected/collected/pending.
  const showPayPerMealCards =
    mixed || (!prepaidOnly && (alwaysShow || hasPayPerMealAmounts));
  const showPrepaidCards = prepaidOnly && (alwaysShow || hasPrepaidAmounts);

  if (!loading && !showPayPerMealCards && !showPrepaidCards) {
    return null;
  }

  const expected =
    formatComboPrice(financial?.expectedCharges ?? null, currencyCode) ?? '—';
  const collected = formatComboPrice(financial?.collected ?? null, currencyCode) ?? '—';
  const underReview = formatComboPrice(financial?.underReview ?? null, currencyCode) ?? '—';
  const pending = formatComboPrice(financial?.pending ?? null, currencyCode) ?? '—';

  const balanceSold =
    prepaid?.unit === 'MEALS'
      ? t('dashboard.financial.mealsCount', { count: prepaid.balanceSold ?? 0 })
      : formatComboPrice(prepaid?.balanceSold ?? null, prepaid?.currencyCode ?? currencyCode) ??
        '—';
  const balanceConsumed =
    prepaid?.unit === 'MEALS'
      ? t('dashboard.financial.mealsCount', { count: prepaid.balanceConsumed ?? 0 })
      : formatComboPrice(prepaid?.balanceConsumed ?? null, prepaid?.currencyCode ?? currencyCode) ??
        '—';
  const balanceRemaining =
    prepaid?.unit === 'MEALS'
      ? t('dashboard.financial.mealsCount', { count: prepaid.balanceRemaining ?? 0 })
      : formatComboPrice(prepaid?.balanceRemaining ?? null, prepaid?.currencyCode ?? currencyCode) ??
        '—';

  return (
    <View style={styles.wrap}>
      <DashboardSectionTitle title={title ?? t('dashboard.financial.title')} />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : showPrepaidCards && !showPayPerMealCards ? (
        <View style={styles.row}>
          <DashboardStatCard
            compact
            icon={Wallet}
            accent={ACCENT.expected}
            value={balanceSold}
            label={t('dashboard.financial.balanceSold')}
            onPress={onExpectedPress}
          />
          <DashboardStatCard
            compact
            icon={Inbox}
            accent={ACCENT.collected}
            value={balanceConsumed}
            label={t('dashboard.financial.balanceConsumed')}
            onPress={onCollectedPress}
          />
          <DashboardStatCard
            compact
            icon={IndianRupee}
            accent={ACCENT.pending}
            value={balanceRemaining}
            label={t('dashboard.financial.balanceRemaining')}
            onPress={onPendingPress}
          />
        </View>
      ) : (
        <View style={styles.row}>
          <DashboardStatCard
            compact
            icon={Wallet}
            accent={ACCENT.expected}
            value={expected}
            label={t('dashboard.financial.expected')}
            onPress={onExpectedPress}
          />
          <DashboardStatCard
            compact
            icon={Inbox}
            accent={ACCENT.collected}
            value={collected}
            label={t('dashboard.financial.collected')}
            onPress={onCollectedPress}
          />
          <DashboardStatCard
            compact
            icon={Clock}
            accent={ACCENT.underReview}
            value={underReview}
            label={t('dashboard.financial.underReview')}
            onPress={onUnderReviewPress}
          />
          <DashboardStatCard
            compact
            icon={IndianRupee}
            accent={ACCENT.pending}
            value={pending}
            label={t('dashboard.financial.pending')}
            onPress={onPendingPress}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  loader: {
    marginVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    width: '100%',
  },
});
