import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberPaymentLedgerRow, PrepaidBalanceUnit } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import { Badge } from '../ui';

type MemberPaymentRowProps = {
  row: MemberPaymentLedgerRow;
  prepaidMode?: boolean;
  onPress: () => void;
};

function statusLabel(status: MemberPaymentLedgerRow['status'], t: (key: string) => string): string {
  switch (status) {
    case 'PAID':
      return t('payments.status.paid');
    case 'PARTIAL':
      return t('payments.status.partial');
    case 'PENDING':
      return t('payments.status.pending');
    default:
      return t('payments.status.none');
  }
}

function formatBalanceValue(
  amount: number | null | undefined,
  unit: PrepaidBalanceUnit | null | undefined,
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

export function MemberPaymentRow({ row, prepaidMode, onPress }: MemberPaymentRowProps) {
  const { t } = useTranslation();
  const currencyCode = row.currencyCode ?? 'INR';
  const unit = row.mealBalanceUnit ?? 'MEALS';
  const isPrepaid = prepaidMode ?? row.mealBillingType === 'PREPAID_BALANCE';

  if (isPrepaid) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        accessibilityRole="button">
        <View style={styles.main}>
          <Text style={styles.name} numberOfLines={1}>
            {row.memberName}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {t('payments.row.balanceLine', {
              remaining: formatBalanceValue(row.mealBalanceRemaining, unit, currencyCode, t),
              used: formatBalanceValue(row.mealBalanceConsumed, unit, currencyCode, t),
            })}
          </Text>
        </View>
        <View style={styles.trailing}>
          <Text style={styles.purchased}>
            {formatComboPrice(row.collected, currencyCode) ?? '—'}
          </Text>
          <Text style={styles.purchasedLabel}>{t('payments.row.collectedThisMonth')}</Text>
        </View>
      </Pressable>
    );
  }

  const pendingDisplay = formatComboPrice(row.pending, currencyCode) ?? '—';
  const collectedDisplay = formatComboPrice(row.collected, currencyCode);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button">
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>
          {row.memberName}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {collectedDisplay
            ? t('payments.row.collectedOfExpected', {
                collected: collectedDisplay,
                expected: formatComboPrice(row.expectedCharges, currencyCode) ?? '—',
              })
            : t('payments.row.expected', {
                expected: formatComboPrice(row.expectedCharges, currencyCode) ?? '—',
              })}
        </Text>
      </View>
      <View style={styles.trailing}>
        {(row.pending ?? 0) > 0 ? (
          <Text style={styles.pendingAmount}>{pendingDisplay}</Text>
        ) : null}
        <Badge label={statusLabel(row.status, t)} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  cardPressed: {
    opacity: 0.92,
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  pendingAmount: {
    ...typography.bodyStrong,
    color: '#EAB308',
    fontSize: 14,
  },
  purchased: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 14,
  },
  purchasedLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
});
