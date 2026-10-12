import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SpacePaymentResponse } from '../../api/types';
import { colors, shadows, spacing, typography } from '../../theme';
import { formatBillingPeriod } from '../../utils/paymentProofPolicy';
import { formatPaymentDueDate } from '../../utils/paymentHistory';
import { formatPaymentAmount } from '../../utils/paymentAmount';
import {
  displayMealPaymentTitle,
  mealPaymentListSubtitle,
  type MealSelectionSummaryModel,
} from '../../utils/mealSelectionSummary';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import { PaymentReferenceLabel } from './PaymentReferenceLabel';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { PaymentStatusCardFrame } from './PaymentStatusCardFrame';

type UniversalPaymentCardProps = {
  payment: SpacePaymentResponse;
  onPress?: () => void;
  /** Opens the update/pay modal without navigating to detail. */
  onUpdatePress?: () => void;
  showMember?: boolean;
  /** Optional meal breakdown meta from existing meal activity API. */
  mealSummary?: MealSelectionSummaryModel | null;
  ownerActions?: React.ReactNode;
};

export function UniversalPaymentCard({
  payment,
  onPress,
  onUpdatePress,
  showMember = false,
  mealSummary = null,
  ownerActions,
}: UniversalPaymentCardProps) {
  const { t, i18n } = useTranslation();
  const needsUpdate = payment.paymentStatus === 'UPDATE_REQUESTED';
  const canUpdate =
    payment.paymentStatus === 'PENDING' ||
    payment.paymentStatus === 'REJECTED' ||
    payment.paymentStatus === 'UPDATE_REQUESTED';

  const updateLabel =
    payment.paymentStatus === 'PENDING'
      ? t('paymentCollection.payNow')
      : t('paymentCollection.updatePayment');

  const displayTitle =
    payment.paymentType === 'MEAL'
      ? displayMealPaymentTitle(payment.title, payment.month, month =>
          formatBillingPeriod(month, i18n.language),
          t('payments.mealPaymentTitle'),
        )
      : payment.title;

  const mealSubtitle =
    payment.paymentType === 'MEAL' && mealSummary
      ? mealPaymentListSubtitle(
          mealSummary,
          count => t('meals.summary.platesCount', { count }),
          mealType => t(mealTypeLabelKey(mealType)),
        )
      : null;

  const periodLabel = payment.month ? shortBillingPeriod(payment.month, i18n.language) : null;
  const heading =
    periodLabel && !displayTitle.toLowerCase().includes(periodLabel.toLowerCase())
      ? `${displayTitle} · ${periodLabel}`
      : displayTitle;
  const nameForAvatar = (showMember ? payment.memberName : displayTitle).trim();
  const initial = nameForAvatar.charAt(0).toUpperCase() || '?';
  const avatar = avatarTint(nameForAvatar);
  const overdueLabel = payment.isOverdue
    ? t('paymentCollection.overdue.compact', { count: payment.daysOverdue ?? 0 })
    : null;
  const amountLabel = formatPaymentAmount(payment.amount, payment.currencyCode);

  const summary = (
    <View style={styles.summary}>
      <View style={styles.identityRow}>
        <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
          <Text style={[styles.avatarText, { color: avatar.fg }]}>{initial}</Text>
        </View>
        <View style={styles.identityText}>
          <View style={styles.nameRow}>
            <Text style={styles.memberName} numberOfLines={2}>
              {showMember ? payment.memberName : heading}
            </Text>
            <PaymentStatusBadge
              status={payment.isOverdue ? 'OVERDUE' : payment.paymentStatus}
              style={styles.statusBadge}
            />
          </View>
          {showMember && payment.memberMobile ? (
            <Text style={styles.meta} numberOfLines={1}>
              {payment.memberMobile}
            </Text>
          ) : null}
          {payment.targetLabel ? (
            <Text style={styles.meta} numberOfLines={2}>
              {payment.targetLabel}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.payRow}>
        <Text style={styles.title} numberOfLines={2}>
          {showMember ? heading : t(`paymentCollection.type.${payment.paymentType}`)}
        </Text>
        {amountLabel ? (
          <Text style={styles.amount} adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1}>
            {amountLabel}
          </Text>
        ) : null}
      </View>
      <View style={styles.dueRow}>
        <Text style={styles.due} numberOfLines={1}>
          {t('paymentCollection.dueDate', { date: formatPaymentDueDate(payment.dueDate) })}
        </Text>
        {overdueLabel ? (
          <Text style={styles.overdue} numberOfLines={1}>
            {overdueLabel}
          </Text>
        ) : null}
      </View>
      {mealSubtitle ? (
        <Text style={styles.mealSubtitle} numberOfLines={1}>
          {mealSubtitle}
        </Text>
      ) : null}
      {!showMember ? <PaymentReferenceLabel source={payment} style={styles.paymentReference} /> : null}
    </View>
  );

  return (
    <PaymentStatusCardFrame status={payment.paymentStatus} style={styles.card}>
      <View style={styles.cardInner}>
        {onPress ? (
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed }) => pressed && styles.pressed}>
            {summary}
          </Pressable>
        ) : (
          summary
        )}

        {payment.paymentStatus === 'REJECTED' && payment.rejectionReason ? (
          <Text style={styles.note} numberOfLines={2}>
            {payment.rejectionReason}
          </Text>
        ) : null}
        {needsUpdate && payment.rejectionReason ? (
          <Text style={styles.note} numberOfLines={2}>
            {payment.rejectionReason}
          </Text>
        ) : null}

        {ownerActions}
        {!ownerActions && canUpdate ? (
          onUpdatePress ? (
            <Pressable onPress={onUpdatePress} hitSlop={8} style={styles.ctaPressable}>
              <Text style={styles.cta}>{updateLabel}</Text>
            </Pressable>
          ) : (
            <Text style={styles.cta}>{updateLabel}</Text>
          )
        ) : null}
      </View>
    </PaymentStatusCardFrame>
  );
}

function shortBillingPeriod(monthIso: string, locale?: string): string {
  const [yearPart, monthPart] = monthIso.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!year || !month) {
    return monthIso;
  }
  return new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: 'short',
    year: 'numeric',
  });
}

const AVATAR_TINTS = [
  { bg: '#ECFDF5', fg: '#047857' },
  { bg: '#EFF6FF', fg: '#1D4ED8' },
  { bg: '#FFF7ED', fg: '#C2410C' },
  { bg: '#F5F3FF', fg: '#6D28D9' },
] as const;

function avatarTint(name: string): { bg: string; fg: string } {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_TINTS[code % AVATAR_TINTS.length];
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardInner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.92,
  },
  summary: {
    gap: 6,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 16,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  memberName: {
    ...typography.bodyStrong,
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 20,
  },
  statusBadge: {
    flexShrink: 0,
    marginTop: 1,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  amount: {
    ...typography.bodyStrong,
    fontSize: 18,
    lineHeight: 22,
    flexShrink: 1,
    textAlign: 'right',
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  due: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  overdue: {
    ...typography.caption,
    color: '#B91C1C',
    fontWeight: '700',
    flexShrink: 0,
  },
  mealSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  paymentReference: {
    marginTop: 2,
  },
  note: {
    ...typography.caption,
    color: '#991B1B',
  },
  ctaPressable: {
    alignSelf: 'flex-start',
  },
  cta: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
});
