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
  onExpectedPress?: () => void;
  onCollectedPress?: () => void;
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
  onExpectedPress,
  onCollectedPress,
  onPendingPress,
}: DashboardFinancialSnapshotProps) {
  const { t } = useTranslation();
  const currencyCode = financial?.currencyCode ?? 'INR';
  const mixed = financial?.mixedMealBilling === true;
  const prepaidOnly =
    financial?.mealBillingType === 'PREPAID_BALANCE' && !mixed;
  const prepaid = financial?.prepaidBalance;
  const showPayPerMealCards =
    mixed ||
    (!prepaidOnly &&
      (financial?.expectedCharges != null ||
        financial?.collected != null ||
        financial?.pending != null));
  const showPrepaidCards =
    prepaidOnly &&
    (prepaid?.balanceSold != null ||
      prepaid?.balanceConsumed != null ||
      prepaid?.balanceRemaining != null ||
      prepaid?.amountCollected != null);

  if (!loading && !showPayPerMealCards && !showPrepaidCards) {
    return null;
  }

  const expected =
    formatComboPrice(financial?.expectedCharges ?? null, currencyCode) ?? '—';
  const collected = formatComboPrice(financial?.collected ?? null, currencyCode) ?? '—';
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
        <View style={styles.row}>
          <SnapshotCard
            value={expected}
            label={t('dashboard.financial.expectedCharges')}
            onPress={onExpectedPress}
          />
          <SnapshotCard
            value={collected}
            label={t('dashboard.financial.collected')}
            valueStyle={styles.collected}
            onPress={onCollectedPress}
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
  card: {
    flex: 1,
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
