import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import { addDaysIsoDate, todayIsoDate, tomorrowIsoDate } from '../../utils/mealDates';

type MenuDatePickerModalProps = {
  visible: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (isoDate: string) => void;
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
}: MenuDatePickerModalProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDraft(value);
      setError(null);
    }
  }, [value, visible]);

  const applyDate = (isoDate: string) => {
    if (!isValidIsoDate(isoDate)) {
      setError(t('meals.planning.invalidDate'));
      return;
    }
    onConfirm(isoDate);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={event => event.stopPropagation()}>
          <Text style={styles.title}>{t('meals.planning.pickDate')}</Text>

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
            onChangeText={setDraft}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button label={t('common.cancel')} variant="ghost" onPress={onClose} />
            <Button label={t('common.continue')} onPress={() => applyDate(draft)} />
          </View>
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
    gap: spacing.md,
  },
  title: { ...typography.h3 },
  shortcuts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
  inputLabel: { ...typography.caption, color: colors.muted, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    backgroundColor: colors.white,
    ...typography.body,
  },
  error: { ...typography.caption, color: '#DC2626' },
  actions: { gap: spacing.sm },
});
