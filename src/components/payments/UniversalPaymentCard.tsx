import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SpacePaymentResponse } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatPaymentAmount, formatPaymentDueDate } from '../../utils/paymentHistory';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { PaymentStatusCardFrame } from './PaymentStatusCardFrame';

type UniversalPaymentCardProps = {
  payment: SpacePaymentResponse;
  onPress?: () => void;
  /** Opens the update/pay modal without navigating to detail. */
  onUpdatePress?: () => void;
  showMember?: boolean;
};

export function UniversalPaymentCard({
  payment,
  onPress,
  onUpdatePress,
  showMember = false,
}: UniversalPaymentCardProps) {
  const { t } = useTranslation();
  const needsUpdate = payment.paymentStatus === 'UPDATE_REQUESTED';
  const canUpdate =
    payment.paymentStatus === 'PENDING' ||
    payment.paymentStatus === 'REJECTED' ||
    payment.paymentStatus === 'UPDATE_REQUESTED';

  const updateLabel =
    payment.paymentStatus === 'PENDING'
      ? t('paymentCollection.payNow')
      : t('paymentCollection.updatePayment');

  const content = (
    <PaymentStatusCardFrame status={payment.paymentStatus} style={styles.card}>
      <View style={styles.cardInner}>
        <View style={styles.headerRow}>
          {showMember ? (
            <Text style={styles.memberName} numberOfLines={1}>
              {payment.memberName}
            </Text>
          ) : (
            <Text style={styles.titleInline} numberOfLines={2}>
              {payment.title}
            </Text>
          )}
          <PaymentStatusBadge status={payment.paymentStatus} />
        </View>
        {payment.targetLabel ? <Text style={styles.target}>{payment.targetLabel}</Text> : null}
        {showMember ? <Text style={styles.title}>{payment.title}</Text> : null}
        <Text style={styles.amount}>{formatPaymentAmount(payment.amount, payment.currencyCode)}</Text>
        <Text style={styles.due}>
          {t('paymentCollection.dueDate', { date: formatPaymentDueDate(payment.dueDate) })}
        </Text>

        {payment.paymentStatus === 'REJECTED' && payment.rejectionReason ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>{t('paymentCollection.rejectedTitle')}</Text>
            <Text style={styles.messageText} numberOfLines={3}>
              {payment.rejectionReason}
            </Text>
          </View>
        ) : null}

        {needsUpdate && payment.rejectionReason ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageLabel}>{t('paymentCollection.ownerRequest')}</Text>
            <Text style={styles.messageText} numberOfLines={3}>
              {payment.rejectionReason}
            </Text>
          </View>
        ) : null}

        {canUpdate ? (
          onUpdatePress ? (
            <Pressable
              onPress={e => {
                e.stopPropagation?.();
                onUpdatePress();
              }}
              hitSlop={8}
              style={styles.ctaPressable}>
              <Text style={styles.cta}>{updateLabel}</Text>
            </Pressable>
          ) : (
            <Text style={styles.cta}>{updateLabel}</Text>
          )
        ) : null}
      </View>
    </PaymentStatusCardFrame>
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
  cardInner: {
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  memberName: {
    ...typography.bodyStrong,
    flex: 1,
    minWidth: 0,
  },
  titleInline: {
    ...typography.h3,
    flex: 1,
    minWidth: 0,
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
  amount: {
    ...typography.bodyStrong,
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  due: {
    ...typography.caption,
    color: colors.muted,
  },
  messageBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  messageLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    marginBottom: 2,
  },
  messageText: {
    ...typography.caption,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  ctaPressable: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  cta: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
});
