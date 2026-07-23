import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { MonthPickerModal } from '../ui/MonthPickerModal';
import { colors, radius, spacing, typography } from '../../theme';
import { currentMonthKey } from '../../utils/dashboardFinancial';
import { formatMonthLabel } from '../../utils/memberMealActivityCalendar';

type MemberMealActivityMonthNavProps = {
  month: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  disableNext?: boolean;
  /** When set, the month label opens a month/year picker and jumps via this callback. */
  onMonthSelect?: (monthKey: string) => void;
  /** Latest selectable month for the picker (YYYY-MM). Defaults to current month. */
  maxMonth?: string;
};

export function MemberMealActivityMonthNav({
  month,
  onPreviousMonth,
  onNextMonth,
  disableNext = false,
  onMonthSelect,
  maxMonth,
}: MemberMealActivityMonthNavProps) {
  const { t, i18n } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const monthLabel = formatMonthLabel(month, i18n.language);
  const pickerEnabled = typeof onMonthSelect === 'function';

  return (
    <>
      <View style={styles.monthHeader}>
        <Pressable style={styles.monthNavBtn} onPress={onPreviousMonth} hitSlop={8}>
          <ChevronLeft size={18} color={colors.primaryDark} strokeWidth={2.4} />
        </Pressable>
        {pickerEnabled ? (
          <Pressable
            style={styles.monthLabelPressable}
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('common.selectMonth')}
            hitSlop={4}>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
          </Pressable>
        ) : (
          <Text style={[styles.monthLabel, styles.monthLabelStatic]}>{monthLabel}</Text>
        )}
        <Pressable
          style={[styles.monthNavBtn, disableNext && styles.monthNavBtnDisabled]}
          onPress={onNextMonth}
          disabled={disableNext}
          hitSlop={8}>
          <ChevronRight
            size={18}
            color={disableNext ? colors.muted : colors.primaryDark}
            strokeWidth={2.4}
          />
        </Pressable>
      </View>

      {pickerEnabled ? (
        <MonthPickerModal
          visible={pickerOpen}
          value={month}
          maxMonth={maxMonth ?? currentMonthKey()}
          onClose={() => setPickerOpen(false)}
          onSelect={onMonthSelect}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavBtnDisabled: {
    opacity: 0.4,
  },
  monthLabelPressable: {
    flex: 1,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    ...typography.bodyStrong,
    textAlign: 'center',
    fontSize: 14,
    color: colors.textPrimary,
  },
  monthLabelStatic: {
    flex: 1,
  },
});
