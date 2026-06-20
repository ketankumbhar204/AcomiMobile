import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberMealActivityMonth } from '../../api/types';
import { colors, spacing, typography } from '../../theme';
import { todayIsoDate } from '../../utils/mealDates';
import { MEAL_ACTIVITY_SLOT_COLORS } from '../../utils/memberMealActivityCalendar';
import { MemberMealActivityCalendar } from './MemberMealActivityCalendar';

type MemberMealActivityCalendarPanelProps = {
  month: string;
  loading: boolean;
  error: string | null;
  activity: MemberMealActivityMonth | null;
  selectedDate?: string | null;
  onSelectDate: (date: string) => void;
};

const LEGEND_ITEMS = [
  { key: 'ACCEPTED', labelKey: 'meals.activity.legendAccepted' },
  { key: 'PENDING', labelKey: 'meals.activity.legendPending' },
  { key: 'SKIPPED', labelKey: 'meals.activity.legendSkipped' },
  { key: 'NO_MENU', labelKey: 'meals.activity.legendNoMenu' },
  { key: 'INACTIVE', labelKey: 'meals.activity.legendInactive' },
] as const;

export function MemberMealActivityCalendarPanel({
  month,
  loading,
  error,
  activity,
  selectedDate,
  onSelectDate,
}: MemberMealActivityCalendarPanelProps) {
  const { t } = useTranslation();
  const days = useMemo(() => activity?.days ?? [], [activity?.days]);

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  if (loading) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <MemberMealActivityCalendar
        month={month}
        days={days}
        todayIso={todayIsoDate()}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
      />

      <View style={styles.legend}>
        {LEGEND_ITEMS.map(item => (
          <View key={item.key} style={styles.legendItem}>
            <View
              style={[
                styles.legendSwatch,
                {
                  backgroundColor:
                    MEAL_ACTIVITY_SLOT_COLORS[item.key as keyof typeof MEAL_ACTIVITY_SLOT_COLORS],
                },
              ]}
            />
            <Text style={styles.legendText}>{t(item.labelKey)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: '#DC2626',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    ...typography.caption,
    color: colors.muted,
    fontSize: 11,
  },
});
