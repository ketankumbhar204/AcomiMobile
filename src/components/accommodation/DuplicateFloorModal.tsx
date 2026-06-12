import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, FormInput } from '../ui';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type DuplicateFloorModalProps = {
  visible: boolean;
  sourceName: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (targetFloorNumber: number, targetName?: string, renumberRooms?: boolean) => void;
};

export function DuplicateFloorModal({
  visible,
  sourceName,
  loading,
  error,
  onClose,
  onSubmit,
}: DuplicateFloorModalProps) {
  const { t } = useTranslation();
  const [floorNumber, setFloorNumber] = useState('');
  const [targetName, setTargetName] = useState('');
  const [renumberRooms, setRenumberRooms] = useState(true);
  const [floorError, setFloorError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setFloorNumber('');
      setTargetName('');
      setRenumberRooms(true);
      setFloorError(null);
    }
  }, [visible]);

  function handleSubmit() {
    const parsed = Number(floorNumber);
    if (!Number.isFinite(parsed)) {
      setFloorError(t('accommodation.duplicate.floor.numberRequired'));
      return;
    }
    setFloorError(null);
    onSubmit(parsed, targetName.trim() || undefined, renumberRooms);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <Text style={styles.title}>{t('accommodation.duplicate.floor.title')}</Text>
          <Text style={styles.hint}>
            {t('accommodation.duplicate.floor.hint', { name: sourceName })}
          </Text>
          <FormInput
            label={t('accommodation.duplicate.floor.targetNumber')}
            value={floorNumber}
            onChangeText={setFloorNumber}
            keyboardType="number-pad"
            error={floorError}
          />
          <FormInput
            label={t('accommodation.fields.name')}
            value={targetName}
            onChangeText={setTargetName}
            placeholder={t('accommodation.duplicate.floor.namePlaceholder')}
          />
          <Pressable
            style={[styles.toggle, renumberRooms && styles.toggleOn]}
            onPress={() => setRenumberRooms(value => !value)}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>{t('accommodation.duplicate.floor.renumber')}</Text>
              <Text style={styles.toggleDesc}>{t('accommodation.duplicate.floor.renumberHint')}</Text>
            </View>
            <Text style={styles.toggleValue}>
              {renumberRooms ? t('common.yes') : t('common.no')}
            </Text>
          </Pressable>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button label={t('common.cancel')} variant="ghost" onPress={onClose} style={styles.btn} />
            <Button
              label={t('accommodation.duplicate.confirm')}
              onPress={handleSubmit}
              loading={loading}
              style={styles.btn}
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.xl,
    ...shadows.md,
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  hint: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
  },
  toggleOn: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  toggleText: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    ...typography.bodyStrong,
  },
  toggleDesc: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  toggleValue: {
    ...typography.body,
    color: colors.primaryDark,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.sm,
  },
});
