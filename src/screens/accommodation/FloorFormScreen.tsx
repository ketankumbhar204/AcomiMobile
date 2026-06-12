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
import { accommodationApi } from '../../api/accommodationApi';
import { Button, FormInput, HeaderBackButton } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';

type Nav = NativeStackNavigationProp<MainStackParamList, 'FloorForm'>;
type Route = NativeStackScreenProps<MainStackParamList, 'FloorForm'>['route'];

export function FloorFormScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, buildingId, mode, floorId } = route.params;
  const isEdit = mode === 'edit';
  const showToast = useToastStore(state => state.showToast);

  const [name, setName] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? t('accommodation.floors.editTitle') : t('accommodation.floors.createTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [isEdit, navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      if (!isEdit || !floorId) return;
      accommodationApi.getFloor(spaceId, buildingId, floorId).then(floor => {
        setName(floor.name);
        setFloorNumber(String(floor.floorNumber));
        setSortOrder(String(floor.sortOrder));
      }).catch(err => setSubmitError(getAccommodationErrorMessage(err)));
    }, [buildingId, floorId, isEdit, spaceId]),
  );

  async function handleSubmit() {
    Keyboard.dismiss();
    if (!name.trim()) {
      setNameError(t('accommodation.floors.nameRequired'));
      return;
    }
    const parsedFloorNumber = parseInt(floorNumber, 10);
    const parsedSortOrder = sortOrder ? parseInt(sortOrder, 10) : parsedFloorNumber;
    if (Number.isNaN(parsedFloorNumber)) {
      setSubmitError(t('accommodation.floors.floorNumberRequired'));
      return;
    }

    setNameError(null);
    setSubmitting(true);
    setSubmitError(null);

    try {
      if (isEdit && floorId) {
        await accommodationApi.updateFloor(spaceId, buildingId, floorId, {
          name: name.trim(),
          floorNumber: parsedFloorNumber,
          sortOrder: parsedSortOrder,
        });
        showToast(t('accommodation.floors.updateSuccess'));
      } else {
        await accommodationApi.createFloor(spaceId, buildingId, {
          name: name.trim(),
          floorNumber: parsedFloorNumber,
          sortOrder: parsedSortOrder,
        });
        showToast(t('accommodation.floors.createSuccess'));
      }
      navigation.goBack();
    } catch (err) {
      setSubmitError(getAccommodationErrorMessage(err, 'accommodation.errors.saveFloor'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormInput label={t('accommodation.fields.name')} value={name} onChangeText={setName} error={nameError} />
          <FormInput
            label={t('accommodation.floors.floorNumberLabel')}
            value={floorNumber}
            onChangeText={setFloorNumber}
            keyboardType="number-pad"
          />
          <FormInput
            label={t('accommodation.floors.sortOrder')}
            value={sortOrder}
            onChangeText={setSortOrder}
            keyboardType="number-pad"
          />
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
