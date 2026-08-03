import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Button } from './Button';
import { colors, radius, spacing, typography } from '../../theme';
import { currentMonthKey } from '../../utils/dashboardFinancial';

type MonthPickerModalProps = {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSelect: (monthKey: string) => void;
  /** Latest selectable month (YYYY-MM). Defaults to the current calendar month. */
  maxMonth?: string;
};

const MONTH_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function parseMonthKey(monthKey: string): { year: number; month: number } | null {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return null;
  }
  const [year, month] = monthKey.split('-').map(Number);
  if (month < 1 || month > 12) {
    return null;
  }
  return { year, month };
}

function toMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function shortMonthLabel(month: number, locale: string): string {
  return new Date(2000, month - 1, 1).toLocaleDateString(locale, { month: 'short' });
}

/** Month/year jump picker used by monthly summary navigation. */
export function MonthPickerModal({
  visible,
  value,
  onClose,
  onSelect,
  maxMonth,
}: MonthPickerModalProps) {
  const { t, i18n } = useTranslation();
  const ceiling = maxMonth ?? currentMonthKey();
  const parsedValue = parseMonthKey(value) ?? parseMonthKey(currentMonthKey())!;
  const [viewYear, setViewYear] = useState(parsedValue.year);

  useEffect(() => {
    if (visible) {
      const next = parseMonthKey(value) ?? parseMonthKey(currentMonthKey())!;
      setViewYear(next.year);
    }
  }, [value, visible]);

  const maxParsed = useMemo(() => parseMonthKey(ceiling) ?? parsedValue, [ceiling, parsedValue]);
  const canGoNextYear = viewYear < maxParsed.year;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
          <Text style={styles.title}>{t('common.selectMonth')}</Text>

          <View style={styles.yearHeader}>
            <Pressable
              style={styles.yearNavBtn}
              onPress={() => setViewYear(year => year - 1)}
              accessibilityRole="button"
              accessibilityLabel={t('common.previousYear')}>
              <ChevronLeft size={18} color={colors.primaryDark} strokeWidth={2.4} />
            </Pressable>
            <Text style={styles.yearLabel}>{viewYear}</Text>
            <Pressable
              style={[styles.yearNavBtn, !canGoNextYear && styles.yearNavBtnDisabled]}
              onPress={() => {
                if (canGoNextYear) {
                  setViewYear(year => year + 1);
                }
              }}
              disabled={!canGoNextYear}
              accessibilityRole="button"
              accessibilityLabel={t('common.nextYear')}>
              <ChevronRight
                size={18}
                color={canGoNextYear ? colors.primaryDark : colors.muted}
                strokeWidth={2.4}
              />
            </Pressable>
          </View>

          <View style={styles.grid}>
            {MONTH_KEYS.map(month => {
              const monthKey = toMonthKey(viewYear, month);
              const selected = monthKey === value;
              const disabled = monthKey > ceiling;
              return (
                <Pressable
                  key={monthKey}
                  style={[
                    styles.monthCell,
                    selected && styles.monthCellSelected,
                    disabled && styles.monthCellDisabled,
                  ]}
                  disabled={disabled}
                  onPress={() => {
                    onSelect(monthKey);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled }}>
                  <Text
                    style={[
                      styles.monthCellLabel,
                      selected && styles.monthCellLabelSelected,
                      disabled && styles.monthCellLabelDisabled,
                    ]}>
                    {shortMonthLabel(month, i18n.language)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.h3,
  },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yearNavBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  yearNavBtnDisabled: {
    opacity: 0.45,
  },
  yearLabel: {
    ...typography.bodyStrong,
    fontSize: 18,
    color: colors.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  monthCell: {
    width: '22%',
    flexGrow: 1,
    minWidth: 72,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthCellSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  monthCellDisabled: {
    opacity: 0.4,
  },
  monthCellLabel: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.textPrimary,
  },
  monthCellLabelSelected: {
    color: colors.primaryDark,
  },
  monthCellLabelDisabled: {
    color: colors.muted,
  },
});
