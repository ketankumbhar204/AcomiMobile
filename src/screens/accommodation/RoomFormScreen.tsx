import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { CircleDollarSign, Hash, Type, Users } from 'lucide-react-native';
import type { AccommodationStatus, RoomType } from '../../api/types';
import { accommodationApi } from '../../api/accommodationApi';
import {
  AccommodationFormHero,
  AccommodationStatusPicker,
  PricingAfterCreateHint,
  RoomTypePicker,
} from '../../components/accommodation';
import { FormInput, HeaderBackButton } from '../../components/ui';
import { StickyFormActions } from '../../components/progressive';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
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
  const [defaultRent, setDefaultRent] = useState('');
  const [defaultDeposit, setDefaultDeposit] = useState('');
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
        setDefaultRent(room.defaultRent != null ? String(room.defaultRent) : '');
        setDefaultDeposit(room.defaultDeposit != null ? String(room.defaultDeposit) : '');
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
        const parsedRent = defaultRent.trim() ? Number(defaultRent.trim()) : null;
        const parsedDeposit = defaultDeposit.trim() ? Number(defaultDeposit.trim()) : null;
        await accommodationApi.updateRoom(spaceId, roomId, {
          name: name.trim(),
          roomNumber: roomNumber.trim(),
          roomType,
          capacity: parsedCapacity,
          status,
          defaultRent: parsedRent != null && Number.isFinite(parsedRent) ? parsedRent : null,
          defaultDeposit:
            parsedDeposit != null && Number.isFinite(parsedDeposit) ? parsedDeposit : null,
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
        <View style={styles.flex}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <AccommodationFormHero
              level="room"
              eyebrow={t('accommodation.rooms.formEyebrow')}
              heading={
                isEdit
                  ? t('accommodation.rooms.editTitle')
                  : t('accommodation.rooms.createTitle')
              }
              subheading={
                isEdit
                  ? t('accommodation.rooms.formSubheadingEdit')
                  : t('accommodation.rooms.formSubheadingCreate')
              }
            />

            {!isEdit ? <PricingAfterCreateHint entityKey="room" /> : null}

            {submitError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{submitError}</Text>
              </View>
            ) : null}

            <View style={styles.formCard}>
              <FormInput
                label={t('accommodation.fields.name')}
                value={name}
                onChangeText={setName}
                leadingIcon={Type}
              />
              <FormInput
                label={t('accommodation.rooms.roomNumberLabel')}
                value={roomNumber}
                onChangeText={setRoomNumber}
                leadingIcon={Hash}
              />
              <RoomTypePicker value={roomType} onChange={setRoomType} error={roomTypeError} />
              <FormInput
                label={t('accommodation.rooms.capacity')}
                value={capacity}
                onChangeText={setCapacity}
                keyboardType="number-pad"
                leadingIcon={Users}
              />
              {isEdit ? (
                <AccommodationStatusPicker value={status} onChange={setStatus} />
              ) : null}
              {isEdit ? (
                <>
                  <FormInput
                    label={t('accommodation.fields.defaultRent')}
                    value={defaultRent}
                    onChangeText={setDefaultRent}
                    keyboardType="numeric"
                    leadingIcon={CircleDollarSign}
                  />
                  <FormInput
                    label={t('accommodation.fields.defaultDeposit')}
                    value={defaultDeposit}
                    onChangeText={setDefaultDeposit}
                    keyboardType="numeric"
                    leadingIcon={CircleDollarSign}
                  />
                </>
              ) : null}
            </View>
          </ScrollView>
          <StickyFormActions
            primary={{
              label: t('common.save'),
              onPress: handleSubmit,
              loading: submitting,
            }}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  formCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.xs,
    ...shadows.sm,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.button,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    ...typography.body,
    color: '#DC2626',
  },
});
