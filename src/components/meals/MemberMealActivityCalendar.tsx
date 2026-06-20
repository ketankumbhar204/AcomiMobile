import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { MemberMealActivityDay, MemberMealActivitySlotStatus, MealType } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { MEAL_TYPES } from '../../utils/mealLabels';
import {
  buildCalendarWeeks,
  dayHasActivity,
  MEAL_ACTIVITY_SLOT_COLORS,
  normalizeActivityDate,
} from '../../utils/memberMealActivityCalendar';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type MemberMealActivityCalendarProps = {
  month: string;
  days: MemberMealActivityDay[];
  todayIso: string;
  selectedDate?: string | null;
  onSelectDate: (date: string) => void;
};

function slotByMealType(day: MemberMealActivityDay | undefined, mealType: MealType) {
  return day?.slots.find(slot => slot.mealType === mealType);
}

function MealIndicator({ status }: { status: MemberMealActivitySlotStatus }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.indicator,
        { backgroundColor: MEAL_ACTIVITY_SLOT_COLORS[status] },
      ]}
    />
  );
}

export function MemberMealActivityCalendar({
  month,
  days,
  todayIso,
  selectedDate,
  onSelectDate,
}: MemberMealActivityCalendarProps) {
  const dayMap = new Map<string, MemberMealActivityDay>();
  for (const day of days) {
    const key = normalizeActivityDate(day.date);
    if (key) {
      dayMap.set(key, day);
    }
  }
  const weeks = buildCalendarWeeks(month);

  return (
    <View style={styles.wrapper} collapsable={false}>
      <View style={styles.weekdayRow} pointerEvents="none">
        {WEEKDAY_LABELS.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={`week-${weekIndex}`} style={styles.weekRow}>
          {week.map((date, dayIndex) => {
            if (!date) {
              return <View key={`empty-${weekIndex}-${dayIndex}`} style={styles.dayCell} />;
            }

            const day = dayMap.get(date);
            const hasActivity = dayHasActivity(day);
            const dayNumber = Number(date.slice(-2));
            const isToday = date === todayIso;
            const isSelected = selectedDate === date;

            return (
              <TouchableOpacity
                key={date}
                accessibilityRole="button"
                accessibilityLabel={`${date}`}
                activeOpacity={0.55}
                style={[
                  styles.dayCell,
                  isToday && styles.dayCellToday,
                  isSelected && styles.dayCellSelected,
                  !hasActivity && styles.dayCellMuted,
                ]}
                onPress={() => onSelectDate(date)}>
                <Text
                  pointerEvents="none"
                  style={[
                    styles.dayNumber,
                    isToday && styles.dayNumberToday,
                    isSelected && styles.dayNumberSelected,
                    !hasActivity && styles.dayNumberMuted,
                  ]}>
                  {dayNumber}
                </Text>
                <View pointerEvents="none" style={styles.indicatorStack}>
                  {MEAL_TYPES.map(mealType => {
                    const slot = slotByMealType(day, mealType);
                    const status = slot?.status ?? 'INACTIVE';
                    return <MealIndicator key={mealType} status={status} />;
                  })}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekdayLabel: {
    ...typography.caption,
    flex: 1,
    textAlign: 'center',
    color: colors.muted,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxs,
    paddingBottom: spacing.xxs,
    borderRadius: 8,
  },
  dayCellToday: {
    backgroundColor: colors.lightGreen,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellMuted: {
    opacity: 0.9,
  },
  dayNumber: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 3,
  },
  dayNumberToday: {
    color: colors.primaryDark,
  },
  dayNumberSelected: {
    color: colors.white,
  },
  dayNumberMuted: {
    color: colors.muted,
  },
  indicatorStack: {
    width: '72%',
    gap: 2,
  },
  indicator: {
    height: 3,
    borderRadius: 2,
    width: '100%',
  },
});
