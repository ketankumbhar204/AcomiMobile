import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import {
  addDaysIsoDate,
  addMonthsToMonthKey,
  isoDateToMonthKey,
  isPastMenuDate,
  todayIsoDate,
  tomorrowIsoDate,
} from '../../utils/mealDates';
import { formatMonthLabel } from '../../utils/memberMealActivityCalendar';
import { MenuMonthCalendar } from './MenuMonthCalendar';

type MenuDatePickerModalProps = {
  visible: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (isoDate: string) => void;
  /** When true, past dates can be selected (e.g. dashboard read-only history). */
  allowPastDates?: boolean;
};

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function MenuDatePickerModal({
  visible,
  value,
  onClose,
  onConfirm,
  allowPastDates = false,
}: MenuDatePickerModalProps) {
  const { t, i18n } = useTranslation();
  const [draft, setDraft] = useState(value);
  const [viewMonth, setViewMonth] = useState(isoDateToMonthKey(value));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setViewMonth(isoDateToMonthKey(value));
      setError(null);
    }
  }, [value, visible]);

  const applyDate = (isoDate: string) => {
    if (!isValidIsoDate(isoDate)) {
      setError(t('meals.planning.invalidDate'));
      return;
    }
    if (!allowPastDates && isPastMenuDate(isoDate)) {
      setError(t('meals.planning.pastDateNotAllowed'));
      return;
    }
    onConfirm(isoDate);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{t('meals.planning.pickDate')}</Text>

            <View style={styles.monthHeader}>
              <Pressable
                style={styles.monthNavBtn}
                onPress={() => setViewMonth(prev => addMonthsToMonthKey(prev, -1))}
                accessibilityRole="button">
                <Text style={styles.monthNavText}>◀</Text>
              </Pressable>
              <Text style={styles.monthLabel}>{formatMonthLabel(viewMonth, i18n.language)}</Text>
              <Pressable
                style={styles.monthNavBtn}
                onPress={() => setViewMonth(prev => addMonthsToMonthKey(prev, 1))}
                accessibilityRole="button">
                <Text style={styles.monthNavText}>▶</Text>
              </Pressable>
            </View>

            <MenuMonthCalendar
              month={viewMonth}
              selectedDate={draft}
              allowPastDates={allowPastDates}
              onSelectDate={applyDate}
            />

            <View style={styles.shortcuts}>
              <Pressable style={styles.shortcutChip} onPress={() => applyDate(todayIsoDate())}>
                <Text style={styles.shortcutText}>{t('meals.planning.today')}</Text>
              </Pressable>
              <Pressable style={styles.shortcutChip} onPress={() => applyDate(tomorrowIsoDate())}>
                <Text style={styles.shortcutText}>{t('meals.planning.tomorrow')}</Text>
              </Pressable>
              <Pressable
                style={styles.shortcutChip}
                onPress={() => applyDate(addDaysIsoDate(todayIsoDate(), 7))}>
                <Text style={styles.shortcutText}>{t('meals.planning.nextWeek')}</Text>
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>{t('meals.planning.customDate')}</Text>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={text => {
                setDraft(text);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="YYYY-MM-DD"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.actions}>
              <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
              <Button label={t('common.continue')} onPress={() => applyDate(draft)} />
            </View>
          </ScrollView>
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
    borderRadius: radius.button,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  title: { ...typography.h3, marginBottom: spacing.md },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  monthNavText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    fontSize: 12,
  },
  monthLabel: {
    ...typography.bodyStrong,
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
  },
  shortcuts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  shortcutChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  shortcutText: { ...typography.caption, color: colors.primaryDark, fontWeight: '600' },
  inputLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    backgroundColor: colors.white,
    ...typography.body,
    marginTop: spacing.xs,
  },
  error: { ...typography.caption, color: '#DC2626', marginTop: spacing.xs },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
