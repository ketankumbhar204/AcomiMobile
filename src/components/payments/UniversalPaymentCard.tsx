import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BedSingle, CalendarDays } from 'lucide-react-native';
import type { SpacePaymentResponse } from '../../api/types';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { showsPaymentOverdueCue } from '../../utils/paymentStatus';
import { formatBillingPeriod } from '../../utils/paymentProofPolicy';
import { formatPaymentDueDate } from '../../utils/paymentHistory';
import { formatPaymentAmount } from '../../utils/paymentAmount';
import {
  displayMealPaymentTitle,
  mealPaymentListSubtitle,
  type MealSelectionSummaryModel,
} from '../../utils/mealSelectionSummary';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import {
  formatPaymentListTitle,
  paymentListBadgeStatus,
  paymentListDisplayStatus,
  paymentListStatusLabelKey,
} from '../../utils/paymentRefundDisplay';
import {
  getPaymentStatusTheme,
  type PaymentStatusTheme,
} from '../../utils/paymentStatusTheme';
import { usePaymentStayTrail } from '../../hooks/usePaymentStayTrail';
import { ContactNumberLine } from '../member/ContactAndStayMeta';
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

/** Keep hierarchy; mock uses bullet separators instead of arrows. */
function locationDisplay(label: string | null | undefined): string | null {
  const raw = label?.trim() ?? '';
  if (!raw) {
    return null;
  }
  return raw
    .split(/\s*(?:→|[•·|])\s*/)
    .map(part => part.trim())
    .filter(Boolean)
    .join(' • ');
}

function panelTint(theme: PaymentStatusTheme): string {
  // Soften badge fills so the payment panel stays readable.
  switch (theme.background) {
    case '#FEF3C7':
      return '#FFFBEB';
    case '#D1FAE5':
      return '#ECFDF5';
    case '#FEE2E2':
      return '#FEF2F2';
    case '#DBEAFE':
      return '#EFF6FF';
    case '#FFEDD5':
      return '#FFF7ED';
    case '#FFF7ED':
      return '#FFF7ED';
    default:
      return '#F8FAFC';
  }
}

export function UniversalPaymentCard({
  payment,
  onPress,
  onUpdatePress,
  showMember = false,
  mealSummary = null,
  ownerActions,
}: UniversalPaymentCardProps) {
  const { t, i18n } = useTranslation();
  const stayLabel = usePaymentStayTrail(payment.spaceId, payment);
  const needsUpdate = payment.paymentStatus === 'UPDATE_REQUESTED';
  const canUpdate =
    payment.paymentStatus === 'PENDING' ||
    payment.paymentStatus === 'REJECTED' ||
    payment.paymentStatus === 'UPDATE_REQUESTED';

  const updateLabel =
    payment.paymentStatus === 'PENDING'
      ? t('paymentCollection.payNow')
      : t('paymentCollection.updatePayment');

  const cleanedTitle = formatPaymentListTitle(payment);
  const displayTitle =
    payment.paymentType === 'MEAL'
      ? displayMealPaymentTitle(cleanedTitle, payment.month, month =>
          formatBillingPeriod(month, i18n.language),
          t('payments.mealPaymentTitle'),
        )
      : cleanedTitle;

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
  const listStatus = paymentListDisplayStatus(payment);
  const badgeStatus = paymentListBadgeStatus(listStatus);
  const badgeLabel = t(paymentListStatusLabelKey(listStatus), {
    defaultValue: listStatus === 'PARTIALLY_REFUNDED' ? 'Partially refunded' : undefined,
  });
  const statusTheme = getPaymentStatusTheme(badgeStatus);
  const nameForAvatar = (showMember ? payment.memberName : displayTitle).trim();
  const initial = nameForAvatar.charAt(0).toUpperCase() || '?';
  const avatar = avatarTint(nameForAvatar);
  const overdueLabel = showsPaymentOverdueCue(payment)
    ? t('paymentCollection.overdue.compact', { count: payment.daysOverdue ?? 0 })
    : null;
  const amountLabel = formatPaymentAmount(payment.amount, payment.currencyCode);
  // Period + billable days straight from the payment row; no amount is derived here.
  const billedDaysSubtitle =
    payment.paymentType === 'RENT' &&
    payment.billableDays != null &&
    payment.billableDays > 0 &&
    payment.billingPeriodStart &&
    payment.billingPeriodEnd &&
    (payment.isProrated || (payment.daysInMonth != null && payment.billableDays !== payment.daysInMonth))
      ? t('paymentCollection.billedDays', {
          start: formatPaymentDueDate(payment.billingPeriodStart),
          end: formatPaymentDueDate(payment.billingPeriodEnd),
          days: payment.billableDays,
          defaultValue: '{{start}} – {{end}} · {{days}} billable days',
        })
      : null;

  // Title stays the charge name; period / billable days sit under the calendar icon.
  const calendarLine = billedDaysSubtitle ?? periodLabel ?? mealSubtitle;
  const locationText =
    payment.paymentType === 'MEAL' ? null : locationDisplay(stayLabel);
  const paymentTitle = showMember
    ? displayTitle
    : t(`paymentCollection.type.${payment.paymentType}`);

  const summary = (
    <View style={styles.summary}>
      <View style={styles.identityRow}>
        <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
          <Text style={[styles.avatarText, { color: avatar.fg }]}>{initial}</Text>
        </View>
        <View style={styles.identityText}>
          <Text style={styles.memberName} numberOfLines={2}>
            {showMember ? payment.memberName : heading}
          </Text>
          {showMember ? (
            <ContactNumberLine
              value={payment.memberMobile}
              name={payment.memberName}
              textStyle={styles.meta}
            />
          ) : null}
        </View>
        <PaymentStatusBadge
          status={badgeStatus}
          label={badgeLabel}
          showNeutral
          style={styles.statusBadge}
        />
      </View>

      {locationText ? (
        <View style={styles.locationRow}>
          <BedSingle size={14} color={colors.textSecondary} strokeWidth={2.2} />
          <Text style={styles.locationText} numberOfLines={2}>
            {locationText}
          </Text>
        </View>
      ) : null}

      <View style={[styles.paymentPanel, { backgroundColor: panelTint(statusTheme) }]}>
        <View style={styles.paymentLeft}>
          <Text style={styles.title} numberOfLines={3}>
            {paymentTitle}
          </Text>
          {calendarLine ? (
            <View style={styles.calendarRow}>
              <CalendarDays size={13} color={colors.textSecondary} strokeWidth={2.2} />
              <Text style={styles.calendarText} numberOfLines={2}>
                {calendarLine}
              </Text>
            </View>
          ) : null}
          {!showMember ? (
            <PaymentReferenceLabel source={payment} style={styles.paymentReference} />
          ) : null}
        </View>
        <View style={styles.paymentDivider} />
        <View style={styles.paymentRight}>
          {amountLabel ? (
            <Text style={styles.amount} adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1}>
              {amountLabel}
            </Text>
          ) : null}
          <Text style={styles.due} numberOfLines={1}>
            {t('paymentCollection.dueDate', { date: formatPaymentDueDate(payment.dueDate) })}
          </Text>
          {overdueLabel ? (
            <Text style={styles.overdue} numberOfLines={1}>
              {overdueLabel}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <PaymentStatusCardFrame status={badgeStatus} style={styles.card}>
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
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  summary: {
    gap: spacing.sm,
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
    gap: 0,
    justifyContent: 'center',
  },
  memberName: {
    ...typography.bodyStrong,
    fontSize: 15,
    lineHeight: 18,
    marginBottom: 0,
  },
  statusBadge: {
    flexShrink: 0,
    marginTop: 1,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    minWidth: 0,
    lineHeight: 16,
  },
  paymentPanel: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  paymentLeft: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  paymentDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    alignSelf: 'stretch',
  },
  paymentRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
    flexShrink: 0,
    maxWidth: '42%',
    paddingLeft: spacing.xs,
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 18,
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  calendarText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    minWidth: 0,
    lineHeight: 16,
  },
  amount: {
    ...typography.bodyStrong,
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'right',
  },
  due: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  overdue: {
    ...typography.caption,
    color: '#B91C1C',
    fontWeight: '700',
    textAlign: 'right',
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
