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
import { Hash, Type } from 'lucide-react-native';
import { accommodationApi } from '../../api/accommodationApi';
import { AccommodationFormHero } from '../../components/accommodation';
import { FormInput, HeaderBackButton } from '../../components/ui';
import { StickyFormActions } from '../../components/progressive';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, shadows, spacing, typography } from '../../theme';
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
        <View style={styles.flex}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <AccommodationFormHero
              level="floor"
              eyebrow={t('accommodation.floors.formEyebrow')}
              heading={
                isEdit
                  ? t('accommodation.floors.editTitle')
                  : t('accommodation.floors.createTitle')
              }
              subheading={
                isEdit
                  ? t('accommodation.floors.formSubheadingEdit')
                  : t('accommodation.floors.formSubheadingCreate')
              }
            />

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
                error={nameError}
                leadingIcon={Type}
              />
              <FormInput
                label={t('accommodation.floors.floorNumberLabel')}
                value={floorNumber}
                onChangeText={setFloorNumber}
                keyboardType="number-pad"
                leadingIcon={Hash}
              />
              <FormInput
                label={t('accommodation.floors.sortOrder')}
                value={sortOrder}
                onChangeText={setSortOrder}
                keyboardType="number-pad"
                leadingIcon={Hash}
              />
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
