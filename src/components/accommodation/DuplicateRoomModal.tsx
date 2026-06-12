import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, FormInput } from '../ui';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type DuplicateRoomModalProps = {
  visible: boolean;
  sourceName: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (targetRoomNumber?: string) => void;
};

export function DuplicateRoomModal({
  visible,
  sourceName,
  loading,
  error,
  onClose,
  onSubmit,
}: DuplicateRoomModalProps) {
  const { t } = useTranslation();
  const [targetRoomNumber, setTargetRoomNumber] = useState('');

  useEffect(() => {
    if (visible) {
      setTargetRoomNumber('');
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <Text style={styles.title}>{t('accommodation.duplicate.room.title')}</Text>
          <Text style={styles.hint}>
            {t('accommodation.duplicate.room.hint', { name: sourceName })}
          </Text>
          <FormInput
            label={t('accommodation.duplicate.room.targetNumber')}
            value={targetRoomNumber}
            onChangeText={setTargetRoomNumber}
            placeholder={t('accommodation.duplicate.room.autoPlaceholder')}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button label={t('common.cancel')} variant="ghost" onPress={onClose} style={styles.btn} />
            <Button
              label={t('accommodation.duplicate.confirm')}
              onPress={() => onSubmit(targetRoomNumber.trim() || undefined)}
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
