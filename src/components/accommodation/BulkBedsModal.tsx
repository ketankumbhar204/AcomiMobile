import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BedLabelStyle } from '../../api/types';
import { validateBulkBeds } from '../../utils/accommodationLimits';
import { Button, FormInput } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';

const LABEL_STYLES: BedLabelStyle[] = ['ALPHA', 'NUMERIC'];

type BulkBedsModalProps = {
  visible: boolean;
  roomName: string;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (count: number, labelStyle: BedLabelStyle) => void;
};

export function BulkBedsModal({
  visible,
  roomName,
  loading,
  error,
  onClose,
  onSubmit,
}: BulkBedsModalProps) {
  const { t } = useTranslation();
  const [count, setCount] = useState('3');
  const [labelStyle, setLabelStyle] = useState<BedLabelStyle>('ALPHA');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setCount('3');
      setLabelStyle('ALPHA');
      setValidationError(null);
    }
  }, [visible]);

  function handleSubmit() {
    const parsed = Number(count);
    const limitError = validateBulkBeds(parsed);
    if (limitError) {
      setValidationError(t(limitError));
      return;
    }
    setValidationError(null);
    onSubmit(parsed, labelStyle);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <Text style={styles.title}>{t('accommodation.bulk.beds.title')}</Text>
          <Text style={styles.hint}>{t('accommodation.bulk.beds.hint', { name: roomName })}</Text>
          <FormInput
            label={t('accommodation.bulk.beds.count')}
            value={count}
            onChangeText={setCount}
            keyboardType="number-pad"
          />
          <Text style={styles.label}>{t('accommodation.bulk.beds.labelStyle')}</Text>
          <View style={styles.chipRow}>
            {LABEL_STYLES.map(style => (
              <Pressable
                key={style}
                style={[styles.chip, labelStyle === style && styles.chipSelected]}
                onPress={() => setLabelStyle(style)}>
                <Text style={[styles.chipText, labelStyle === style && styles.chipTextSelected]}>
                  {t(`accommodation.bulk.beds.labelStyle_${style}`)}
                </Text>
              </Pressable>
            ))}
          </View>
          {validationError ? <Text style={styles.errorText}>{validationError}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button label={t('common.cancel')} variant="ghost" onPress={onClose} style={styles.btn} />
            <Button
              label={t('accommodation.bulk.confirm')}
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
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  chipTextSelected: {
    color: colors.primaryDark,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
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
