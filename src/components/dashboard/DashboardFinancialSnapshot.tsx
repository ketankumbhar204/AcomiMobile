import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DashboardFinancialSummary } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import { DashboardSectionTitle } from './DashboardSectionTitle';

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

function SnapshotCard({
  value,
  label,
  valueStyle,
  onPress,
}: {
  value: string;
  label: string;
  valueStyle?: object;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Text style={[styles.value, valueStyle]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, styles.cardPressable, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button">
      {content}
    </Pressable>
  );
}

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
          <SnapshotCard
            value={balanceSold}
            label={t('dashboard.financial.balanceSold')}
            onPress={onExpectedPress}
          />
          <SnapshotCard
            value={balanceConsumed}
            label={t('dashboard.financial.balanceConsumed')}
            valueStyle={styles.collected}
            onPress={onCollectedPress}
          />
          <SnapshotCard
            value={balanceRemaining}
            label={t('dashboard.financial.balanceRemaining')}
            valueStyle={styles.pending}
            onPress={onPendingPress}
          />
        </View>
      ) : (
        <View style={styles.grid}>
          <SnapshotCard
            value={expected}
            label={t('dashboard.financial.expected')}
            onPress={onExpectedPress}
          />
          <SnapshotCard
            value={collected}
            label={t('dashboard.financial.collected')}
            valueStyle={styles.collected}
            onPress={onCollectedPress}
          />
          <SnapshotCard
            value={underReview}
            label={t('dashboard.financial.underReview')}
            valueStyle={styles.underReview}
            onPress={onUnderReviewPress}
          />
          <SnapshotCard
            value={pending}
            label={t('dashboard.financial.pending')}
            valueStyle={styles.pending}
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
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  card: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: 0,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xxs,
    alignItems: 'center',
    gap: 2,
    position: 'relative',
  },
  cardPressable: {},
  cardPressed: {
    opacity: 0.88,
    borderColor: colors.primary,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 15,
  },
  collected: {
    color: colors.success,
  },
  underReview: {
    color: colors.primary,
  },
  pending: {
    color: '#EAB308',
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
  },
  chevron: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xxs,
    fontSize: 14,
    fontWeight: '300',
    color: colors.muted,
  },
});
