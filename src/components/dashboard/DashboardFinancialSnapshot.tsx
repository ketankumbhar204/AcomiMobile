import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  IndianRupee,
  Inbox,
  Wallet,
} from 'lucide-react-native';
import type { DashboardFinancialSummary } from '../../api/types';
import { colors, pastels, radius, spacing, typography } from '../../theme';
import { formatPaymentAmount } from '../../utils/paymentAmount';
import { formatMonthYear, isFutureMonth, shiftMonthKey } from '../../utils/dashboardFinancial';
import { DashboardStatCard } from './shared/DashboardStatCard';

type DashboardFinancialSnapshotProps = {
  loading: boolean;
  financial: DashboardFinancialSummary | null;
  title?: string;
  /** When true, always render This month cards (show —) even if all amounts are null. */
  alwaysShow?: boolean;
  /** Soft empty-state hint under the section title (e.g. Mess setup). */
  emptyHint?: string;
  onExpectedPress?: () => void;
  onCollectedPress?: () => void;
  onUnderReviewPress?: () => void;
  onPendingPress?: () => void;
  /** YYYY-MM. When set with onMonthChange, shows month navigation. */
  month?: string;
  onMonthChange?: (month: string) => void;
  error?: boolean;
  onRetry?: () => void;
};

const TILE = {
  expected: pastels.mint,
  collected: pastels.green,
  underReview: pastels.blue,
  pending: pastels.orange,
} as const;

/** Dashboard money display: whole rupees with currency. Null or zero is ₹0. */
function formatMoneyOrZero(
  value: number | null | undefined,
  currencyCode?: string | null,
): string {
  const formatted = formatPaymentAmount(value ?? 0, currencyCode ?? 'INR');
  if (formatted) {
    return formatted;
  }
  const code = (currencyCode ?? 'INR').toUpperCase();
  return code === 'INR' ? '₹0' : `${code} 0`;
}

export function DashboardFinancialSnapshot({
  loading,
  financial,
  title,
  alwaysShow = false,
  emptyHint,
  onExpectedPress,
  onCollectedPress,
  onUnderReviewPress,
  onPendingPress,
  month,
  onMonthChange,
  error = false,
  onRetry,
}: DashboardFinancialSnapshotProps) {
  const { t, i18n } = useTranslation();
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
  const showPayPerMealCards =
    mixed || (!prepaidOnly && (alwaysShow || hasPayPerMealAmounts));
  const showPrepaidCards = prepaidOnly && (alwaysShow || hasPrepaidAmounts);

  if (!loading && !showPayPerMealCards && !showPrepaidCards) {
    return null;
  }

  const amountsEmpty =
    !loading &&
    !error &&
    !showPrepaidCards &&
    (financial?.expectedCharges ?? 0) === 0 &&
    (financial?.collected ?? 0) === 0 &&
    (financial?.underReview ?? 0) === 0 &&
    (financial?.pending ?? 0) === 0;
  const hint =
    emptyHint ?? (amountsEmpty ? t('dashboard.financial.monthEmpty') : undefined);
  const expected = formatMoneyOrZero(financial?.expectedCharges, currencyCode);
  const collected = formatMoneyOrZero(financial?.collected, currencyCode);
  const underReview = formatMoneyOrZero(financial?.underReview, currencyCode);
  const pending = formatMoneyOrZero(financial?.pending, currencyCode);

  const balanceSold =
    prepaid?.unit === 'MEALS'
      ? t('dashboard.financial.mealsCount', { count: prepaid.balanceSold ?? 0 })
      : formatMoneyOrZero(prepaid?.balanceSold, prepaid?.currencyCode ?? currencyCode);
  const balanceConsumed =
    prepaid?.unit === 'MEALS'
      ? t('dashboard.financial.mealsCount', { count: prepaid.balanceConsumed ?? 0 })
      : formatMoneyOrZero(prepaid?.balanceConsumed, prepaid?.currencyCode ?? currencyCode);
  const balanceRemaining =
    prepaid?.unit === 'MEALS'
      ? t('dashboard.financial.mealsCount', { count: prepaid.balanceRemaining ?? 0 })
      : formatMoneyOrZero(prepaid?.balanceRemaining, prepaid?.currencyCode ?? currencyCode);

  const nextDisabled = month ? isFutureMonth(shiftMonthKey(month, 1)) : true;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title ?? t('dashboard.financial.title')}
        </Text>
        {month && onMonthChange ? (
          <View style={styles.monthRow}>
            <Pressable
              style={styles.monthBtn}
              onPress={() => onMonthChange(shiftMonthKey(month, -1))}
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.financial.previousMonth')}>
              <ChevronLeft size={16} color={colors.primaryDark} strokeWidth={2.4} />
            </Pressable>
            <Text style={styles.monthLabel} numberOfLines={1}>
              {formatMonthYear(month, i18n.language)}
            </Text>
            <Pressable
              style={[styles.monthBtn, nextDisabled && styles.monthBtnDisabled]}
              onPress={() => {
                const next = shiftMonthKey(month, 1);
                if (!isFutureMonth(next)) {
                  onMonthChange(next);
                }
              }}
              disabled={nextDisabled}
              accessibilityRole="button"
              accessibilityLabel={t('dashboard.financial.nextMonth')}>
              <ChevronRight size={16} color={colors.primaryDark} strokeWidth={2.4} />
            </Pressable>
          </View>
        ) : null}
      </View>
      {hint && !loading ? <Text style={styles.emptyHint}>{hint}</Text> : null}
      {error && !loading ? (
        <Pressable onPress={onRetry} accessibilityRole="button">
          <Text style={styles.errorText}>
            {t('dashboard.financial.loadFailed')} {t('dashboard.financial.retry')}
          </Text>
        </Pressable>
      ) : null}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : showPrepaidCards && !showPayPerMealCards ? (
        <View style={styles.grid}>
          <DashboardStatCard
            compact
            gridItem
            icon={Wallet}
            accent={TILE.expected.fg}
            surface={TILE.expected.bg}
            surfaceBorder={TILE.expected.border}
            value={balanceSold}
            label={t('dashboard.financial.balanceSold')}
            onPress={onExpectedPress}
          />
          <DashboardStatCard
            compact
            gridItem
            icon={Inbox}
            accent={TILE.collected.fg}
            surface={TILE.collected.bg}
            surfaceBorder={TILE.collected.border}
            value={balanceConsumed}
            label={t('dashboard.financial.balanceConsumed')}
            onPress={onCollectedPress}
          />
          <DashboardStatCard
            compact
            gridItem
            icon={IndianRupee}
            accent={TILE.pending.fg}
            surface={TILE.pending.bg}
            surfaceBorder={TILE.pending.border}
            value={balanceRemaining}
            label={t('dashboard.financial.balanceRemaining')}
            onPress={onPendingPress}
          />
        </View>
      ) : (
        <View style={styles.grid}>
          <DashboardStatCard
            compact
            gridItem
            icon={Wallet}
            accent={TILE.expected.fg}
            surface={TILE.expected.bg}
            surfaceBorder={TILE.expected.border}
            value={expected}
            label={t('dashboard.financial.expected')}
            onPress={onExpectedPress}
          />
          <DashboardStatCard
            compact
            gridItem
            icon={Inbox}
            accent={TILE.collected.fg}
            surface={TILE.collected.bg}
            surfaceBorder={TILE.collected.border}
            value={collected}
            label={t('dashboard.financial.collected')}
            onPress={onCollectedPress}
          />
          <DashboardStatCard
            compact
            gridItem
            icon={Clock}
            accent={TILE.underReview.fg}
            surface={TILE.underReview.bg}
            surfaceBorder={TILE.underReview.border}
            value={underReview}
            label={t('dashboard.financial.underReview')}
            onPress={onUnderReviewPress}
          />
          <DashboardStatCard
            compact
            gridItem
            icon={IndianRupee}
            accent={TILE.pending.fg}
            surface={TILE.pending.bg}
            surfaceBorder={TILE.pending.border}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
    minHeight: 28,
  },
  title: {
    ...typography.h3,
    flexShrink: 1,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  monthBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBtnDisabled: {
    opacity: 0.35,
  },
  monthLabel: {
    ...typography.caption,
    color: colors.primaryDark,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    minWidth: 110,
    textAlign: 'center',
  },
  emptyHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
  },
  loader: {
    marginVertical: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
