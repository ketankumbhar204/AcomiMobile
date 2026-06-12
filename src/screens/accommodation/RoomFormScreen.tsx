import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { AccommodationStatus, RoomType } from '../../api/types';
import { accommodationApi } from '../../api/accommodationApi';
import {
  AccommodationStatusPicker,
  RoomTypePicker,
} from '../../components/accommodation';
import { Button, FormInput, HeaderBackButton } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';

type Nav = NativeStackNavigationProp<MainStackParamList, 'RoomForm'>;
type Route = NativeStackScreenProps<MainStackParamList, 'RoomForm'>['route'];

export function RoomFormScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, parentType, parentId, mode, roomId } = route.params;
  const isEdit = mode === 'edit';
  const showToast = useToastStore(state => state.showToast);

  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState('');
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [status, setStatus] = useState<AccommodationStatus | null>(isEdit ? null : 'AVAILABLE');
  const [roomTypeError, setRoomTypeError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? t('accommodation.rooms.editTitle') : t('accommodation.rooms.createTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [isEdit, navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      if (!isEdit || !roomId) return;
      accommodationApi.getRoom(spaceId, roomId).then(room => {
        setName(room.name);
        setRoomNumber(room.roomNumber);
        setCapacity(String(room.capacity));
        setRoomType(room.roomType);
        setStatus(room.status);
      }).catch(err => setSubmitError(getAccommodationErrorMessage(err)));
    }, [isEdit, roomId, spaceId]),
  );

  async function handleSubmit() {
    Keyboard.dismiss();
    if (!roomType) {
      setRoomTypeError(t('accommodation.roomType.required'));
      return;
    }
    setRoomTypeError(null);

    const parsedCapacity = parseInt(capacity, 10);
    if (!name.trim() || !roomNumber.trim() || Number.isNaN(parsedCapacity) || parsedCapacity < 1) {
      setSubmitError(t('accommodation.rooms.validationError'));
      return;
    }
    if (isEdit && !status) {
      setSubmitError(t('accommodation.status.required'));
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (isEdit && roomId && status) {
        await accommodationApi.updateRoom(spaceId, roomId, {
          name: name.trim(),
          roomNumber: roomNumber.trim(),
          roomType,
          capacity: parsedCapacity,
          status,
        });
        showToast(t('accommodation.rooms.updateSuccess'));
      } else {
        const body = {
          name: name.trim(),
          roomNumber: roomNumber.trim(),
          roomType,
          capacity: parsedCapacity,
          status: status ?? 'AVAILABLE',
        };
        if (parentType === 'floor') {
          await accommodationApi.createRoomUnderFloor(spaceId, parentId, body);
        } else {
          await accommodationApi.createRoomUnderUnit(spaceId, parentId, body);
        }
        showToast(t('accommodation.rooms.createSuccess'));
      }
      navigation.goBack();
    } catch (err) {
      setSubmitError(getAccommodationErrorMessage(err, 'accommodation.errors.saveRoom'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormInput label={t('accommodation.fields.name')} value={name} onChangeText={setName} />
          <FormInput
            label={t('accommodation.rooms.roomNumberLabel')}
            value={roomNumber}
            onChangeText={setRoomNumber}
          />
          <RoomTypePicker value={roomType} onChange={setRoomType} error={roomTypeError} />
          <FormInput
            label={t('accommodation.rooms.capacity')}
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="number-pad"
          />
          {isEdit ? (
            <AccommodationStatusPicker value={status} onChange={setStatus} />
          ) : null}
          {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
          <Button label={t('common.save')} onPress={handleSubmit} loading={submitting} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, paddingBottom: spacing.section },
  errorText: { ...typography.body, color: '#DC2626', marginBottom: spacing.md },
});
