import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberPaymentLedgerRow } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import { Badge } from '../ui';

type MemberPaymentRowProps = {
  row: MemberPaymentLedgerRow;
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


export function MemberPaymentRow({ row, onPress }: MemberPaymentRowProps) {
  const { t } = useTranslation();
  const currencyCode = row.currencyCode ?? 'INR';
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
    gap: spacing.xs,
  },
  pendingAmount: {
    ...typography.bodyStrong,
    color: '#EAB308',
    fontSize: 14,
  },
});
