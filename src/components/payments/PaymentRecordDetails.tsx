import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import type { SpacePaymentResponse } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatBillingPeriod } from '../../utils/paymentProofPolicy';
import { formatPaymentDueDate } from '../../utils/paymentHistory';
import { formatPaymentAmount } from '../../utils/paymentAmount';
import { PaymentStatusBadge } from './PaymentStatusBadge';

type PaymentRecordDetailsProps = {
  payment: SpacePaymentResponse;
  spaceName?: string | null;
  memberName?: string | null;
};

export function PaymentRecordDetails({
  payment,
  spaceName,
  memberName,
}: PaymentRecordDetailsProps) {
  const { t, i18n } = useTranslation();
  const [allocationOpen, setAllocationOpen] = useState(true);
  const name = memberName?.trim() || payment.memberName;
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const periodLabel = payment.month ? formatBillingPeriod(payment.month, i18n.language) : null;
  const title = payment.title?.trim() || t(`paymentCollection.type.${payment.paymentType}`);
  const heading =
    periodLabel && !title.toLowerCase().includes(periodLabel.toLowerCase())
      ? `${title} — ${periodLabel}`
      : title;
  const place = [spaceName, payment.targetLabel].filter(Boolean).join(' · ');
  const amount = formatPaymentAmount(payment.amount, payment.currencyCode);
  const outstanding = formatPaymentAmount(payment.outstandingAmount, payment.currencyCode);
  const paid = formatPaymentAmount(payment.paidAmount, payment.currencyCode);
  const base = formatPaymentAmount(payment.baseAmount ?? payment.configuredMonthlyAmount, payment.currencyCode);
  const showDeposit = payment.paymentType === 'DEPOSIT';

  return (
    <View style={styles.card}>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.identityText}>
          <Text style={styles.name}>{name}</Text>
          {payment.memberMobile ? <Text style={styles.meta}>{payment.memberMobile}</Text> : null}
          {place ? <Text style={styles.meta}>{place}</Text> : null}
        </View>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>{heading}</Text>
        <PaymentStatusBadge status={payment.isOverdue ? 'OVERDUE' : payment.paymentStatus} />
      </View>
      {amount ? <Text style={styles.amount}>{amount}</Text> : null}

      <View style={styles.facts}>
        <View style={styles.fact}>
          <Text style={styles.factLabel}>{t('paymentCollection.fields.dueDate', { defaultValue: 'Due date' })}</Text>
          <Text style={styles.factValue}>{formatPaymentDueDate(payment.dueDate)}</Text>
        </View>
        {periodLabel ? (
          <View style={styles.fact}>
            <Text style={styles.factLabel}>
              {t('paymentCollection.detail.fields.billingPeriod', { defaultValue: 'Period' })}
            </Text>
            <Text style={styles.factValue}>{periodLabel}</Text>
          </View>
        ) : null}
      </View>

      {payment.isOverdue ? (
        <View style={styles.alert}>
          <Text style={styles.alertTitle}>
            {t('paymentCollection.overdue.compact', { count: payment.daysOverdue ?? 0 })}
          </Text>
          {outstanding ? (
            <Text style={styles.alertBody}>
              {t('paymentCollection.overdue.outstanding', { amount: outstanding })}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.breakdown}>
        {base && !showDeposit ? (
          <BreakdownItem
            label={t('paymentCollection.detail.fields.baseAmount', { defaultValue: 'Rent amount' })}
            value={base}
          />
        ) : null}
        {showDeposit && amount ? (
          <BreakdownItem
            label={t(`paymentCollection.type.${payment.paymentType}`)}
            value={amount}
          />
        ) : null}
        {paid ? (
          <BreakdownItem
            label={t('paymentCollection.memberPayments.summary.paid', { defaultValue: 'Paid' })}
            value={paid}
          />
        ) : null}
        {outstanding ? (
          <BreakdownItem
            label={t('paymentCollection.fields.outstanding', { defaultValue: 'Outstanding' })}
            value={outstanding}
            emphasis
          />
        ) : null}
      </View>

      {payment.targetLabel ? (
        <View style={styles.allocation}>
          <Pressable
            onPress={() => setAllocationOpen(open => !open)}
            style={styles.allocationHeader}
            accessibilityRole="button">
            <Text style={styles.allocationTitle}>{t('paymentCollection.allocationDetails')}</Text>
            {allocationOpen ? (
              <ChevronUp size={16} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={16} color={colors.textSecondary} />
            )}
          </Pressable>
          {allocationOpen ? (
            <Text style={styles.allocationBody}>
              {payment.targetLabel.replaceAll(' · ', ' → ')}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function BreakdownItem({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.breakItem}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={[styles.factValue, emphasis && styles.emphasis]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  identity: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 18,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
    fontSize: 16,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
    flex: 1,
    fontSize: 18,
  },
  amount: {
    ...typography.h2,
    fontSize: 28,
    lineHeight: 34,
  },
  facts: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fact: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  factLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  factValue: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  emphasis: {
    color: '#B91C1C',
  },
  alert: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.button,
    padding: spacing.sm,
    gap: 2,
  },
  alertTitle: {
    ...typography.bodyStrong,
    color: '#B91C1C',
  },
  alertBody: {
    ...typography.caption,
    color: '#991B1B',
  },
  breakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  breakItem: {
    minWidth: 96,
    gap: 2,
  },
  allocation: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  allocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allocationTitle: {
    ...typography.bodyStrong,
  },
  allocationBody: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
