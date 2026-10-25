import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ChevronUp,
  CircleAlert,
  FileText,
  Home,
  type LucideIcon,
} from 'lucide-react-native';
import type { SpacePaymentResponse } from '../../api/types';
import { usePaymentStayTrail } from '../../hooks/usePaymentStayTrail';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import {
  buildPaymentDetailPresentation,
  type PaymentDetailMoneyTone,
} from '../../utils/paymentDetailPresentation';
import { PaymentStatusBadge } from './PaymentStatusBadge';

type PaymentDetailSummaryProps = {
  payment: SpacePaymentResponse;
  spaceId?: string | null;
  memberName?: string | null;
  spaceName?: string | null;
  title?: string | null;
  mealDaysCount?: number | null;
  children?: React.ReactNode;
};

const TONE_COLOR: Record<PaymentDetailMoneyTone, string> = {
  default: colors.textPrimary,
  positive: colors.success,
  danger: colors.danger,
};

function obligationIcon(paymentType: SpacePaymentResponse['paymentType']): LucideIcon {
  if (paymentType === 'RENT') {
    return Home;
  }
  return FileText;
}

export function PaymentDetailSummary({
  payment,
  spaceId,
  memberName,
  spaceName,
  title,
  mealDaysCount,
  children,
}: PaymentDetailSummaryProps) {
  const { t, i18n } = useTranslation();
  const [detailsOpen, setDetailsOpen] = useState(true);
  const stayTrail = usePaymentStayTrail(spaceId, payment);
  const model = buildPaymentDetailPresentation(payment, t, {
    locale: i18n.language,
    memberName,
    spaceName,
    title,
    mealDaysCount,
  });
  const tenantPlace = stayTrail
    ? [spaceName, stayTrail].filter(Boolean).join(' → ')
    : model.tenantPlace;
  const additional = model.additional.map(row =>
    row.key === 'location' && stayTrail ? { ...row, value: stayTrail } : row,
  );
  const ObligationIcon = obligationIcon(payment.paymentType);

  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{model.tenantInitial}</Text>
          </View>
          <View style={styles.identityText}>
            {model.tenantName ? <Text style={styles.name}>{model.tenantName}</Text> : null}
            {model.tenantMobile ? <Text style={styles.meta}>{model.tenantMobile}</Text> : null}
            {tenantPlace ? <Text style={styles.meta}>{tenantPlace}</Text> : null}
          </View>
        </View>
      </View>

      <View style={styles.card} testID="payment-obligation-card">
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <ObligationIcon size={18} color={colors.teal} strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>{model.title}</Text>
          <PaymentStatusBadge status={model.status} />
        </View>

        {model.amountLabel ? <Text style={styles.amount}>{model.amountLabel}</Text> : null}

        {model.dueDateLabel || model.billingPeriodLabel ? (
          <View style={styles.facts}>
            {model.dueDateLabel ? (
              <View style={styles.fact}>
                <Text style={styles.factLabel}>{t('paymentCollection.detail.fields.dueDate')}</Text>
                <Text style={styles.factValue}>{model.dueDateLabel}</Text>
              </View>
            ) : null}
            {model.billingPeriodLabel ? (
              <View style={styles.fact}>
                <Text style={styles.factLabel}>
                  {t('paymentCollection.detail.fields.billingPeriod')}
                </Text>
                <Text style={styles.factValue}>{model.billingPeriodLabel}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {model.overdue ? (
          <View style={styles.alert}>
            <CircleAlert size={16} color={colors.danger} strokeWidth={2.3} />
            <View style={styles.alertText}>
              <Text style={styles.alertTitle}>
                {t('paymentCollection.overdue.compact', { count: model.overdue.days })}
              </Text>
              {model.overdue.outstandingLabel ? (
                <Text style={styles.alertBody}>
                  {t('paymentCollection.overdue.outstanding', {
                    amount: model.overdue.outstandingLabel,
                  })}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {model.figures.length > 0 ? (
          <View style={styles.figures}>
            {model.figures.map((figure, index) => (
              <View
                key={figure.key}
                style={[styles.figure, index > 0 && styles.figureDivider]}>
                <Text style={styles.factLabel}>{t(figure.labelKey)}</Text>
                <Text style={[styles.figureValue, { color: TONE_COLOR[figure.tone] }]}>
                  {figure.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {model.additional.length > 0 ? (
          <View style={styles.additional}>
            <Pressable
              onPress={() => setDetailsOpen(open => !open)}
              style={styles.additionalHeader}
              accessibilityRole="button"
              accessibilityState={{ expanded: detailsOpen }}
              accessibilityLabel={t('paymentCollection.detail.additionalDetails')}>
              <FileText size={16} color={colors.textSecondary} strokeWidth={2.2} />
              <Text style={styles.additionalTitle}>
                {t('paymentCollection.detail.additionalDetails')}
              </Text>
              {detailsOpen ? (
                <ChevronUp size={18} color={colors.textSecondary} />
              ) : (
                <ChevronDown size={18} color={colors.textSecondary} />
              )}
            </Pressable>
            {detailsOpen
              ? additional.map(row => (
                  <Text key={row.key} style={styles.additionalLine}>
                    {row.labelKey ? (
                      <Text style={styles.additionalLabel}>{t(row.labelKey)}: </Text>
                    ) : null}
                    {row.value}
                  </Text>
                ))
              : null}
          </View>
        ) : null}

        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.sm,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.bodyStrong,
    color: colors.teal,
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
    color: colors.textPrimary,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.bodyStrong,
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    lineHeight: 22,
  },
  amount: {
    ...typography.display,
    marginTop: spacing.md,
  },
  facts: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
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
    color: colors.textPrimary,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    backgroundColor: colors.errorTint,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  alertText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  alertTitle: {
    ...typography.bodyStrong,
    color: colors.danger,
    fontSize: 14,
  },
  alertBody: {
    ...typography.caption,
    color: '#991B1B',
  },
  figures: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  figure: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingRight: spacing.sm,
  },
  figureDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
    paddingLeft: spacing.sm,
  },
  figureValue: {
    ...typography.bodyStrong,
    fontSize: 15,
  },
  additional: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  additionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 36,
  },
  additionalTitle: {
    ...typography.bodyStrong,
    flex: 1,
    fontSize: 15,
  },
  additionalLine: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 24,
  },
  additionalLabel: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    fontSize: 14,
  },
});
