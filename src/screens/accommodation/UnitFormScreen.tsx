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
import type { AccommodationStatus } from '../../api/types';
import { accommodationApi } from '../../api/accommodationApi';
import {
  AccommodationStatusPicker,
  PricingAfterCreateHint,
} from '../../components/accommodation';
import { FormInput, HeaderBackButton } from '../../components/ui';
import { StickyFormActions } from '../../components/progressive';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';

type Nav = NativeStackNavigationProp<MainStackParamList, 'UnitForm'>;
type Route = NativeStackScreenProps<MainStackParamList, 'UnitForm'>['route'];

export function UnitFormScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, buildingId, mode, unitId, floorId } = route.params;
  const isEdit = mode === 'edit';
  const showToast = useToastStore(state => state.showToast);

  const [name, setName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [status, setStatus] = useState<AccommodationStatus | null>(isEdit ? null : 'AVAILABLE');
  const [defaultRent, setDefaultRent] = useState('');
  const [defaultDeposit, setDefaultDeposit] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [unitNumberError, setUnitNumberError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? t('accommodation.units.editTitle') : t('accommodation.units.createTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [isEdit, navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      if (!isEdit || !unitId) return;
      accommodationApi.getUnit(spaceId, buildingId, unitId).then(unit => {
        setName(unit.name);
        setUnitNumber(unit.unitNumber);
        setStatus(unit.status);
        setDefaultRent(unit.defaultRent != null ? String(unit.defaultRent) : '');
        setDefaultDeposit(unit.defaultDeposit != null ? String(unit.defaultDeposit) : '');
      }).catch(err => setSubmitError(getAccommodationErrorMessage(err)));
    }, [buildingId, isEdit, spaceId, unitId]),
  );

  async function handleSubmit() {
    Keyboard.dismiss();
    let valid = true;
    if (!name.trim()) {
      setNameError(t('accommodation.units.nameRequired'));
      valid = false;
    } else setNameError(null);
    if (!unitNumber.trim()) {
      setUnitNumberError(t('accommodation.units.unitNumberRequired'));
      valid = false;
    } else setUnitNumberError(null);
    if (isEdit && !status) {
      setStatusError(t('accommodation.status.required'));
      valid = false;
    } else setStatusError(null);
    if (!valid) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (isEdit && unitId && status) {
        const parsedRent = defaultRent.trim() ? Number(defaultRent.trim()) : null;
        const parsedDeposit = defaultDeposit.trim() ? Number(defaultDeposit.trim()) : null;
        await accommodationApi.updateUnit(spaceId, buildingId, unitId, {
          name: name.trim(),
          unitNumber: unitNumber.trim(),
          status,
          defaultRent: parsedRent != null && Number.isFinite(parsedRent) ? parsedRent : null,
          defaultDeposit:
            parsedDeposit != null && Number.isFinite(parsedDeposit) ? parsedDeposit : null,
        });
        showToast(t('accommodation.units.updateSuccess'));
      } else if (floorId) {
        await accommodationApi.createUnitOnFloor(spaceId, buildingId, floorId, {
          name: name.trim(),
          unitNumber: unitNumber.trim(),
          status: status ?? 'AVAILABLE',
        });
      } else {
        await accommodationApi.createUnit(spaceId, buildingId, {
          name: name.trim(),
          unitNumber: unitNumber.trim(),
          status: status ?? 'AVAILABLE',
        });
        showToast(t('accommodation.units.createSuccess'));
      }
      navigation.goBack();
    } catch (err) {
      setSubmitError(getAccommodationErrorMessage(err, 'accommodation.errors.saveUnit'));
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
            keyboardShouldPersistTaps="handled">
            {!isEdit ? <PricingAfterCreateHint entityKey="unit" /> : null}
            <FormInput label={t('accommodation.fields.name')} value={name} onChangeText={setName} error={nameError} />
            <FormInput
              label={t('accommodation.units.unitNumberLabel')}
              value={unitNumber}
              onChangeText={setUnitNumber}
              error={unitNumberError}
            />
            {isEdit ? (
              <AccommodationStatusPicker value={status} onChange={setStatus} error={statusError} />
            ) : null}
            {isEdit ? (
              <>
                <FormInput
                  label={t('accommodation.fields.defaultRent')}
                  value={defaultRent}
                  onChangeText={setDefaultRent}
                  keyboardType="numeric"
                />
                <FormInput
                  label={t('accommodation.fields.defaultDeposit')}
                  value={defaultDeposit}
                  onChangeText={setDefaultDeposit}
                  keyboardType="numeric"
                />
              </>
            ) : null}
            {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
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
  scroll: { flex: 1 },
  content: { padding: spacing.xxl, paddingBottom: spacing.xl },
  errorText: { ...typography.body, color: '#DC2626', marginBottom: spacing.md },
});
