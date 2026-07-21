import React, { useEffect, useMemo, useState } from 'react';
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
import {
  parseSpaceLocalDateTime,
  toPollCloseAtPayload,
} from '../../utils/pollCloseDisplay';

type PollCloseAtPickerModalProps = {
  visible: boolean;
  initialCloseAt?: string | null;
  onSave: (pollCloseAt: string) => void;
  onCancel: () => void;
  saving?: boolean;
};

/**
 * Lightweight date + time editor for a single poll's pollCloseAt override.
 */
export function PollCloseAtPickerModal({
  visible,
  initialCloseAt,
  onSave,
  onCancel,
  saving = false,
}: PollCloseAtPickerModalProps) {
  const { t } = useTranslation();
  const parsed = useMemo(() => parseSpaceLocalDateTime(initialCloseAt ?? ''), [initialCloseAt]);
  const [dateIso, setDateIso] = useState('2026-01-01');
  const [hour, setHour] = useState('20');
  const [minute, setMinute] = useState('00');

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (parsed) {
      setDateIso(
        `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`,
      );
      setHour(String(parsed.hour).padStart(2, '0'));
      setMinute(String(parsed.minute).padStart(2, '0'));
    }
  }, [parsed, visible]);

  const handleSave = () => {
    const h = Math.min(23, Math.max(0, Number(hour) || 0));
    const m = Math.min(59, Math.max(0, Number(minute) || 0));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso.trim())) {
      return;
    }
    onSave(toPollCloseAtPayload(dateIso.trim(), h, m));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <Text style={styles.title}>{t('meals.poll.editCloseAtTitle')}</Text>
          <Text style={styles.hint}>{t('meals.poll.editCloseAtHint')}</Text>

          <Text style={styles.label}>{t('meals.poll.closeAtDate')}</Text>
          <TextInput
            style={styles.input}
            value={dateIso}
            onChangeText={setDateIso}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
          />

          <Text style={styles.label}>{t('meals.poll.closeAtTime')}</Text>
          <View style={styles.timeRow}>
            <TextInput
              style={[styles.input, styles.timeInput]}
              value={hour}
              onChangeText={setHour}
              keyboardType="number-pad"
              maxLength={2}
              editable={!saving}
            />
            <Text style={styles.colon}>:</Text>
            <TextInput
              style={[styles.input, styles.timeInput]}
              value={minute}
              onChangeText={setMinute}
              keyboardType="number-pad"
              maxLength={2}
              editable={!saving}
            />
            <Text style={styles.timeHint}>{t('meals.poll.closeAtTime24h')}</Text>
          </View>

          <View style={styles.actions}>
            <Button
              label={t('meals.poll.saveCloseAt')}
              onPress={handleSave}
              loading={saving}
              disabled={saving}
            />
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={onCancel}
              disabled={saving}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#0F172A88',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    ...typography.h3,
  },
  hint: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    backgroundColor: colors.surface,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeInput: {
    width: 64,
    textAlign: 'center',
  },
  colon: {
    ...typography.h3,
  },
  timeHint: {
    ...typography.caption,
    flex: 1,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
});
