import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import type { DayMealPaymentListItem } from '../../utils/dayMealPayments';
import { formatMenuDate } from '../../utils/mealDates';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import { PaymentReferenceLabel } from './PaymentReferenceLabel';
import { PaymentStatusBadge } from './PaymentStatusBadge';

type DayMealPaymentCardProps = {
  item: DayMealPaymentListItem;
  selected?: boolean;
  selectionMode?: boolean;
  onPress: () => void;
  onToggleSelect?: () => void;
};

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
          <View style={styles.metaRow}>
            <Text style={styles.meals} numberOfLines={1}>
              {mealsLabel}
            </Text>
            <PaymentStatusBadge status={item.displayStatus} style={styles.statusBadge} />
          </View>
          <PaymentReferenceLabel source={item} style={styles.reference} />
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
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  date: {
    ...typography.bodyStrong,
    flex: 1,
    minWidth: 0,
  },
  amount: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  meals: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    minWidth: 0,
  },
  statusBadge: {
    flexShrink: 0,
  },
  reference: {
    marginTop: 2,
  },
});
