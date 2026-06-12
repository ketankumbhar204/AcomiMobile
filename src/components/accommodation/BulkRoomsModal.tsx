import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AccommodationStatus, RoomType } from '../../api/types';
import { validateBulkRooms } from '../../utils/accommodationLimits';
import { AccommodationStatusPicker } from './AccommodationStatusPicker';
import { RoomTypePicker } from './RoomTypePicker';
import { Button, FormInput } from '../ui';
import { colors, radius, shadows, spacing, typography } from '../../theme';

type BulkRoomsModalProps = {
  visible: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    count: number;
    startRoomNumber?: string;
    roomType: RoomType;
    capacity: number;
    bedsPerRoom: number;
    defaultStatus?: AccommodationStatus;
  }) => void;
};

export function BulkRoomsModal({
  visible,
  loading,
  error,
  onClose,
  onSubmit,
}: BulkRoomsModalProps) {
  const { t } = useTranslation();
  const [count, setCount] = useState('5');
  const [startRoomNumber, setStartRoomNumber] = useState('');
  const [capacity, setCapacity] = useState('2');
  const [bedsPerRoom, setBedsPerRoom] = useState('2');
  const [roomType, setRoomType] = useState<RoomType | null>('SHARED');
  const [status, setStatus] = useState<AccommodationStatus>('AVAILABLE');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setCount('5');
      setStartRoomNumber('');
      setCapacity('2');
      setBedsPerRoom('2');
      setRoomType('SHARED');
      setStatus('AVAILABLE');
      setValidationError(null);
    }
  }, [visible]);

  function handleSubmit() {
    const parsedCount = Number(count);
    const parsedCapacity = Number(capacity);
    const parsedBeds = Number(bedsPerRoom);

    if (!roomType) {
      setValidationError(t('accommodation.roomType.required'));
      return;
    }
    if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
      setValidationError(t('accommodation.bulk.rooms.capacityRequired'));
      return;
    }

    const limitError = validateBulkRooms(parsedCount, parsedBeds);
    if (limitError) {
      setValidationError(t(limitError));
      return;
    }

    setValidationError(null);
    onSubmit({
      count: parsedCount,
      startRoomNumber: startRoomNumber.trim() || undefined,
      roomType,
      capacity: parsedCapacity,
      bedsPerRoom: parsedBeds,
      defaultStatus: status,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <Text style={styles.title}>{t('accommodation.bulk.rooms.title')}</Text>
          <FormInput
            label={t('accommodation.bulk.rooms.count')}
            value={count}
            onChangeText={setCount}
            keyboardType="number-pad"
          />
          <FormInput
            label={t('accommodation.bulk.rooms.startNumber')}
            value={startRoomNumber}
            onChangeText={setStartRoomNumber}
            placeholder={t('accommodation.bulk.autoNumber')}
          />
          <RoomTypePicker value={roomType} onChange={setRoomType} />
          <FormInput
            label={t('accommodation.rooms.capacity')}
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="number-pad"
          />
          <FormInput
            label={t('accommodation.bulk.rooms.bedsPerRoom')}
            value={bedsPerRoom}
            onChangeText={setBedsPerRoom}
            keyboardType="number-pad"
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
    maxHeight: '90%',
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
