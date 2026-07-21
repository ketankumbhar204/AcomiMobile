import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberMealActivityDay } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { MEAL_TYPES } from '../../utils/mealLabels';
import {
  formatActivityListDate,
  formatPaymentLine,
  formatSlotLine,
  type ActivityPaymentDisplay,
} from '../../utils/memberMealActivityHistory';

const PAYMENT_DOT: Record<ActivityPaymentDisplay, string> = {
  PAID: colors.success,
  IN_REVIEW: '#2563EB',
  PENDING: '#EAB308',
  OVERDUE: '#EF4444',
  REJECTED: '#EF4444',
  NONE: colors.muted,
};

const PAYMENT_TEXT: Record<ActivityPaymentDisplay, string> = {
  PAID: colors.success,
  IN_REVIEW: '#1E3A8A',
  PENDING: '#92400E',
  OVERDUE: '#991B1B',
  REJECTED: '#991B1B',
  NONE: colors.muted,
};

type MemberMealActivityDayCardProps = {
  day: MemberMealActivityDay;
  todayIso: string;
  locale: string;
  onPress: (date: string) => void;
};

export function MemberMealActivityDayCard({
  day,
  todayIso,
  locale,
  onPress,
}: MemberMealActivityDayCardProps) {
  const { t } = useTranslation();

  const slotLabel = useMemo(
    () => (status: string) => {
      switch (status) {
        case 'PENDING':
          return t('meals.activity.history.notSelected');
        case 'SKIPPED':
          return t('meals.activity.history.notSelected');
        case 'NO_MENU':
          return t('meals.activity.statusNoMenu');
        case 'INACTIVE':
          return t('meals.activity.statusInactive');
        default:
          return t('meals.activity.history.notSelected');
      }
    },
    [t],
  );

  const paymentLabels = useMemo(
    () => ({
      PAID: t('meals.activity.history.paidStatus'),
      IN_REVIEW: t('meals.activity.history.inReviewStatus'),
      PENDING: t('meals.activity.history.pendingStatus'),
      OVERDUE: t('meals.activity.history.overdue'),
      REJECTED: t('meals.activity.history.rejected'),
      NONE: '',
    }),
    [t],
  );

  const visibleSlots = MEAL_TYPES.map(mealType => {
    const slot = (day.slots ?? []).find(row => row.mealType === mealType);
    return slot ?? null;
  }).filter(slot => slot != null && slot.status !== 'INACTIVE' && slot.status !== 'NO_MENU');

  const payment = formatPaymentLine(day, todayIso, paymentLabels);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(day.date)}
      accessibilityRole="button">
      <Text style={styles.dateLabel}>{formatActivityListDate(day.date, locale)}</Text>

      <View style={styles.slotList}>
        {visibleSlots.map(slot => {
          const line = formatSlotLine(slot, slotLabel);
          return (
            <View key={slot.mealType} style={styles.slotRow}>
              <Text style={styles.slotPrefix}>{line.prefix}:</Text>
              <Text style={styles.slotDetail} numberOfLines={2}>
                {line.detail}
              </Text>
              {line.amount ? <Text style={styles.slotAmount}>{line.amount}</Text> : null}
            </View>
          );
        })}
      </View>

      {payment.display !== 'NONE' && payment.amount ? (
        <View style={styles.paymentRow}>
          <View style={styles.paymentStatus}>
            <View style={[styles.paymentDot, { backgroundColor: PAYMENT_DOT[payment.display] }]} />
            <Text style={[styles.paymentLabel, { color: PAYMENT_TEXT[payment.display] }]}>
              {payment.label}
            </Text>
          </View>
          <Text style={[styles.paymentAmount, { color: PAYMENT_TEXT[payment.display] }]}>
            {payment.amount}
          </Text>
        </View>
      ) : null}
    </Pressable>
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
  cardPressed: {
    opacity: 0.92,
  },
  dateLabel: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  slotList: {
    gap: 4,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  slotPrefix: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    width: 18,
  },
  slotDetail: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
  },
  slotAmount: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    marginLeft: spacing.xs,
    minWidth: 52,
    textAlign: 'right',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 2,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  paymentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paymentLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  paymentAmount: {
    ...typography.caption,
    fontWeight: '700',
    minWidth: 52,
    textAlign: 'right',
  },
});
