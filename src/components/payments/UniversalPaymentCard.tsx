import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SpacePaymentResponse } from '../../api/types';
import { Card } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import { formatPaymentAmount, formatPaymentDueDate } from '../../utils/paymentHistory';

type UniversalPaymentCardProps = {
  payment: SpacePaymentResponse;
  onPress?: () => void;
  showMember?: boolean;
};

function statusStyle(status: SpacePaymentResponse['paymentStatus']) {
  switch (status) {
    case 'PAID':
      return styles.statusPaid;
    case 'UNDER_REVIEW':
    case 'PROOF_UPLOADED':
      return styles.statusSubmitted;
    case 'REJECTED':
      return styles.statusRejected;
    default:
      return styles.statusPending;
  }
}

export function UniversalPaymentCard({
  payment,
  onPress,
  showMember = false,
}: UniversalPaymentCardProps) {
  const { t } = useTranslation();

  const content = (
    <Card style={styles.card}>
      {showMember ? <Text style={styles.memberName}>{payment.memberName}</Text> : null}
      {payment.targetLabel ? (
        <Text style={styles.target}>{payment.targetLabel}</Text>
      ) : null}
      <Text style={styles.title}>{payment.title}</Text>
      <View style={styles.amountRow}>
        <Text style={styles.amount}>{formatPaymentAmount(payment.amount, payment.currencyCode)}</Text>
        <Text style={[styles.status, statusStyle(payment.paymentStatus)]}>
          {t(`paymentCollection.status.${payment.paymentStatus}`)}
        </Text>
      </View>
      <Text style={styles.due}>
        {t('paymentCollection.dueDate', { date: formatPaymentDueDate(payment.dueDate) })}
      </Text>
      {payment.paymentStatus === 'REJECTED' && payment.rejectionReason ? (
        <Text style={styles.rejection}>
          {t('paymentCollection.rejectedReason', { reason: payment.rejectionReason })}
        </Text>
      ) : null}
      {payment.paymentStatus === 'PENDING' ? (
        <Text style={styles.cta}>{t('paymentCollection.payNow')}</Text>
      ) : null}
      {payment.paymentStatus === 'REJECTED' ? (
        <Text style={styles.cta}>{t('paymentCollection.uploadAgain')}</Text>
      ) : null}
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  memberName: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  target: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  amount: {
    ...typography.bodyStrong,
    fontSize: 18,
  },
  status: {
    ...typography.caption,
    fontWeight: '600',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  statusSubmitted: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
  },
  statusPaid: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  due: {
    ...typography.caption,
    color: colors.muted,
  },
  rejection: {
    ...typography.caption,
    color: '#991B1B',
    marginTop: spacing.sm,
  },
  cta: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    marginTop: spacing.sm,
  },
});
