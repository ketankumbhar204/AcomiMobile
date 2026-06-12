import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, FormInput } from '../ui';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type DuplicateBuildingModalProps = {
  visible: boolean;
  sourceName: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (targetName: string, targetCode?: string) => void;
};

export function DuplicateBuildingModal({
  visible,
  sourceName,
  loading,
  error,
  onClose,
  onSubmit,
}: DuplicateBuildingModalProps) {
  const { t } = useTranslation();
  const [targetName, setTargetName] = useState('');
  const [targetCode, setTargetCode] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setTargetName(`${sourceName} (Copy)`);
      setTargetCode('');
      setNameError(null);
    }
  }, [sourceName, visible]);

  function handleSubmit() {
    if (!targetName.trim()) {
      setNameError(t('accommodation.duplicate.building.nameRequired'));
      return;
    }
    setNameError(null);
    onSubmit(targetName.trim(), targetCode.trim() || undefined);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <Text style={styles.title}>{t('accommodation.duplicate.building.title')}</Text>
          <Text style={styles.hint}>
            {t('accommodation.duplicate.building.hint', { name: sourceName })}
          </Text>
          <FormInput
            label={t('accommodation.duplicate.building.targetName')}
            value={targetName}
            onChangeText={setTargetName}
            error={nameError}
          />
          <FormInput
            label={t('accommodation.fields.code')}
            value={targetCode}
            onChangeText={setTargetCode}
            placeholder={t('accommodation.buildings.codePlaceholder')}
          />
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
