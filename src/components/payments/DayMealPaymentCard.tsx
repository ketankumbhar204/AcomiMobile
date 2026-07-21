import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import type { DayMealPaymentListItem } from '../../utils/dayMealPayments';
import { formatMenuDate } from '../../utils/mealDates';
import { mealTypeLabelKey } from '../../utils/mealLabels';

type DayMealPaymentCardProps = {
  item: DayMealPaymentListItem;
  selected?: boolean;
  selectionMode?: boolean;
  onPress: () => void;
  onToggleSelect?: () => void;
};

function statusLabelKey(status: DayMealPaymentListItem['displayStatus']): string {
  switch (status) {
    case 'OVERDUE':
      return 'paymentCollection.dayMeals.status.overdue';
    case 'PENDING_APPROVAL':
      return 'paymentCollection.dayMeals.status.underReview';
    case 'PAID':
      return 'paymentCollection.dayMeals.status.paid';
    case 'REJECTED':
      return 'paymentCollection.dayMeals.status.rejected';
    default:
      return 'paymentCollection.dayMeals.status.pending';
  }
}

function statusColor(status: DayMealPaymentListItem['displayStatus']): string {
  switch (status) {
    case 'OVERDUE':
    case 'REJECTED':
      return '#DC2626';
    case 'PENDING_APPROVAL':
      return '#2563EB';
    case 'PAID':
      return colors.success;
    default:
      return '#D97706';
  }
}

export function DayMealPaymentCard({
  item,
  selected = false,
  selectionMode = false,
  onPress,
  onToggleSelect,
}: DayMealPaymentCardProps) {
  const { t, i18n } = useTranslation();
  const amountLabel = formatComboPrice(item.amount, item.currencyCode) ?? '—';
  const mealsLabel =
    item.mealTypes.length > 0
      ? item.mealTypes.map(type => t(mealTypeLabelKey(type))).join(' • ')
      : t('paymentCollection.dayMeals.mealsFallback');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button">
      <View style={styles.row}>
        {selectionMode && onToggleSelect ? (
          <Pressable
            style={[styles.checkbox, selected && styles.checkboxSelected]}
            onPress={onToggleSelect}
            hitSlop={8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}>
            <Text style={styles.checkboxMark}>{selected ? '✓' : ''}</Text>
          </Pressable>
        ) : null}
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.date}>{formatMenuDate(item.date, i18n.language)}</Text>
            <Text style={styles.amount}>{amountLabel}</Text>
          </View>
          <Text style={styles.meals} numberOfLines={1}>
            {mealsLabel}
          </Text>
          <Text style={[styles.status, { color: statusColor(item.displayStatus) }]}>
            {t(statusLabelKey(item.displayStatus))}
          </Text>
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
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  cardPressed: {
    opacity: 0.94,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    lineHeight: 16,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  date: {
    ...typography.bodyStrong,
    flex: 1,
  },
  amount: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  meals: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  status: {
    ...typography.caption,
    fontWeight: '700',
    marginTop: 2,
  },
});
