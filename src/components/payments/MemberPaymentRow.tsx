import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberPaymentLedgerRow, PrepaidBalanceUnit } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import { PaymentStatusBadge } from './PaymentStatusBadge';

type MemberPaymentRowProps = {
  row: MemberPaymentLedgerRow;
  prepaidMode?: boolean;
  /** When set to collected, trailing amount shows collected (matches Collected filter). */
  amountEmphasis?: 'default' | 'collected';
  onPress: () => void;
};

function memberInitial(name: string | null | undefined): string {
  const trimmed = name?.trim();
  if (!trimmed) {
    return '?';
  }
  return trimmed.charAt(0).toUpperCase();
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

function MemberAvatar({ name }: { name: string }) {
  const initial = useMemo(() => memberInitial(name), [name]);
  return (
    <View style={styles.avatar} accessibilityElementsHidden>
      <Text style={styles.avatarText}>{initial}</Text>
    </View>
  );
}

export function MemberPaymentRow({
  row,
  prepaidMode,
  amountEmphasis = 'default',
  onPress,
}: MemberPaymentRowProps) {
  const { t } = useTranslation();
  const currencyCode = row.currencyCode ?? 'INR';
  const unit = row.mealBalanceUnit ?? 'MEALS';
  const isPrepaid = prepaidMode ?? row.mealBillingType === 'PREPAID_BALANCE';

  if (isPrepaid) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, styles.cardRow, pressed && styles.cardPressed]}
        accessibilityRole="button">
        <MemberAvatar name={row.memberName} />
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
  const underReviewDisplay = formatComboPrice(row.underReview, currencyCode);
  const collectedDisplay = formatComboPrice(row.collected, currencyCode);
  const expectedDisplay = formatComboPrice(row.expectedCharges, currencyCode) ?? '—';
  const hasPending = (row.pending ?? 0) > 0;
  const hasUnderReview =
    row.status === 'UNDER_REVIEW' || ((row.underReview ?? 0) > 0 && !hasPending);

  // Collected filter: always emphasize collected amount (not under-review / pending residual).
  const emphasizeCollected = amountEmphasis === 'collected' && (row.collected ?? 0) > 0;
  const trailingAmount = emphasizeCollected
    ? (collectedDisplay ?? '—')
    : hasPending
      ? pendingDisplay
      : hasUnderReview
        ? (underReviewDisplay ?? '—')
        : (collectedDisplay ?? expectedDisplay);
  const trailingStyle = emphasizeCollected
    ? styles.settledAmount
    : hasPending
      ? styles.pendingAmount
      : hasUnderReview
        ? styles.underReviewAmount
        : styles.settledAmount;

  // Member-month status can stay UNDER_REVIEW when only part of dues are approved.
  // Under the Collected filter, badge reflects the collected slice with success styling.
  const badgeStatus = emphasizeCollected
    ? 'PAID'
    : row.status === 'PENDING' && (row.underReview ?? 0) > 0 && (row.pending ?? 0) <= 0
      ? 'UNDER_REVIEW'
      : row.status;
  const badgeLabel = emphasizeCollected
    ? t('dashboard.financial.collected')
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, styles.cardWithAvatar, pressed && styles.cardPressed]}
      accessibilityRole="button">
      <MemberAvatar name={row.memberName} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {row.memberName}
          </Text>
          <PaymentStatusBadge status={badgeStatus} label={badgeLabel} />
        </View>
        <View style={styles.bodyRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {collectedDisplay
              ? t('payments.row.collectedOfExpected', {
                  collected: collectedDisplay,
                  expected: expectedDisplay,
                })
              : t('payments.row.expected', {
                  expected: expectedDisplay,
                })}
          </Text>
          <Text style={trailingStyle}>{trailingAmount}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  cardWithAvatar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardPressed: {
    opacity: 0.92,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 14,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
    flex: 1,
    minWidth: 0,
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
  underReviewAmount: {
    ...typography.bodyStrong,
    color: colors.primary,
    fontSize: 14,
  },
  settledAmount: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
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
