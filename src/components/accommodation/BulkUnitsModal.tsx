import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AccommodationStatus } from '../../api/types';
import { validateBulkUnits } from '../../utils/accommodationLimits';
import { AccommodationStatusPicker } from './AccommodationStatusPicker';
import { Button, FormInput } from '../ui';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type BulkUnitsModalProps = {
  visible: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (count: number, startUnitNumber?: string, defaultStatus?: AccommodationStatus) => void;
};

export function BulkUnitsModal({
  visible,
  loading,
  error,
  onClose,
  onSubmit,
}: BulkUnitsModalProps) {
  const { t } = useTranslation();
  const [count, setCount] = useState('5');
  const [startNumber, setStartNumber] = useState('');
  const [status, setStatus] = useState<AccommodationStatus>('AVAILABLE');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setCount('5');
      setStartNumber('');
      setStatus('AVAILABLE');
      setValidationError(null);
    }
  }, [visible]);

  function handleSubmit() {
    const parsed = Number(count);
    const limitError = validateBulkUnits(parsed);
    if (limitError) {
      setValidationError(t(limitError));
      return;
    }
    setValidationError(null);
    onSubmit(parsed, startNumber.trim() || undefined, status);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <Text style={styles.title}>{t('accommodation.bulk.units.title')}</Text>
          <FormInput
            label={t('accommodation.bulk.units.count')}
            value={count}
            onChangeText={setCount}
            keyboardType="number-pad"
          />
          <FormInput
            label={t('accommodation.bulk.units.startNumber')}
            value={startNumber}
            onChangeText={setStartNumber}
            placeholder={t('accommodation.bulk.autoNumber')}
          />
          <AccommodationStatusPicker value={status} onChange={setStatus} />
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
    ...shadows.md,
  },
  title: {
    ...typography.h2,
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
