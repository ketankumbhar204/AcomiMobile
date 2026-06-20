import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { isPastMenuDate, todayIsoDate } from '../../utils/mealDates';
import { buildCalendarWeeks } from '../../utils/memberMealActivityCalendar';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type MenuMonthCalendarProps = {
  month: string;
  selectedDate: string;
  allowPastDates?: boolean;
  onSelectDate: (isoDate: string) => void;
};

export function MenuMonthCalendar({
  month,
  selectedDate,
  allowPastDates = false,
  onSelectDate,
}: MenuMonthCalendarProps) {
  const today = todayIsoDate();
  const weeks = buildCalendarWeeks(month);

  return (
    <View style={styles.wrapper}>
      <View style={styles.weekdayRow}>
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

            const isPast = isPastMenuDate(date);
            const disabled = !allowPastDates && isPast;
            const isToday = date === today;
            const isSelected = selectedDate === date;

            return (
              <Pressable
                key={date}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled }}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.dayCell,
                  isToday && !isSelected && styles.dayCellToday,
                  isSelected && styles.dayCellSelected,
                  disabled && styles.dayCellDisabled,
                  pressed && !disabled && styles.dayCellPressed,
                ]}
                onPress={() => onSelectDate(date)}>
                <Text
                  style={[
                    styles.dayNumber,
                    isToday && !isSelected && styles.dayNumberToday,
                    isSelected && styles.dayNumberSelected,
                    disabled && styles.dayNumberDisabled,
                  ]}>
                  {Number(date.slice(-2))}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
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
    aspectRatio: 1,
    maxHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button,
  },
  dayCellToday: {
    backgroundColor: colors.lightGreen,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellDisabled: {
    opacity: 0.35,
  },
  dayCellPressed: {
    opacity: 0.88,
  },
  dayNumber: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dayNumberToday: {
    color: colors.primaryDark,
  },
  dayNumberSelected: {
    color: colors.white,
  },
  dayNumberDisabled: {
    color: colors.muted,
  },
});
