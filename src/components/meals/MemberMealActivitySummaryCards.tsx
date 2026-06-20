import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberMealActivityMonth } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import type { MemberMealActivityView } from './MemberMealActivityTabBar';

type MemberMealActivitySummaryCardsProps = {
  view: MemberMealActivityView;
  activity: MemberMealActivityMonth | null;
};

export function MemberMealActivitySummaryCards({
  view,
  activity,
}: MemberMealActivitySummaryCardsProps) {
  const { t } = useTranslation();
  const summary = activity?.summary;
  if (!summary) {
    return null;
  }

  if (view === 'history') {
    const currencyCode = summary.currencyCode ?? 'INR';
    return (
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.value}>{summary.acceptedMeals}</Text>
          <Text style={styles.label}>{t('meals.activity.history.mealsAccepted')}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.value}>
            {formatComboPrice(summary.amountGenerated, currencyCode) ?? '—'}
          </Text>
          <Text style={styles.label}>{t('meals.activity.history.amountGenerated')}</Text>
        </View>
        <View style={styles.card}>
          <Text style={[styles.value, styles.paid]}>
            {formatComboPrice(summary.paidAmount, currencyCode) ?? '—'}
          </Text>
          <Text style={styles.label}>{t('meals.activity.history.paid')}</Text>
        </View>
        <View style={styles.card}>
          <Text style={[styles.value, styles.pending]}>
            {formatComboPrice(summary.pendingAmount, currencyCode) ?? '—'}
          </Text>
          <Text style={styles.label}>{t('meals.activity.history.pending')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <Text style={styles.value}>{summary.acceptedMeals}</Text>
        <Text style={styles.label}>{t('meals.activity.acceptedMeals')}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.value}>{summary.pendingResponses}</Text>
        <Text style={styles.label}>{t('meals.activity.pendingResponses')}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.value}>{summary.skippedMeals}</Text>
        <Text style={styles.label}>{t('meals.activity.skippedMeals')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  card: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    gap: 1,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 15,
  },
  paid: {
    color: colors.success,
  },
  pending: {
    color: '#EAB308',
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 11,
  },
});
