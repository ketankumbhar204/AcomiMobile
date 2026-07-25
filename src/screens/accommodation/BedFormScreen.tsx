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
import { AccommodationStatusPicker, PricingAfterCreateHint } from '../../components/accommodation';
import { FormInput, HeaderBackButton } from '../../components/ui';
import { StickyFormActions } from '../../components/progressive';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';

type Nav = NativeStackNavigationProp<MainStackParamList, 'BedForm'>;
type Route = NativeStackScreenProps<MainStackParamList, 'BedForm'>['route'];

export function BedFormScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, roomId, mode, bedId } = route.params;
  const isEdit = mode === 'edit';
  const showToast = useToastStore(state => state.showToast);

  const [name, setName] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [status, setStatus] = useState<AccommodationStatus | null>(isEdit ? null : 'AVAILABLE');
  const [defaultRent, setDefaultRent] = useState('');
  const [defaultDeposit, setDefaultDeposit] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit ? t('accommodation.beds.editTitle') : t('accommodation.beds.createTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [isEdit, navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      if (!isEdit || !bedId) return;
      accommodationApi.getBed(spaceId, roomId, bedId).then(bed => {
        setName(bed.name);
        setBedNumber(bed.bedNumber);
        setStatus(bed.status);
        setDefaultRent(bed.defaultRent != null ? String(bed.defaultRent) : '');
        setDefaultDeposit(bed.defaultDeposit != null ? String(bed.defaultDeposit) : '');
      }).catch(err => setSubmitError(getAccommodationErrorMessage(err)));
    }, [bedId, isEdit, roomId, spaceId]),
  );

  async function handleSubmit() {
    Keyboard.dismiss();
    if (!name.trim() || !bedNumber.trim()) {
      setSubmitError(t('accommodation.beds.validationError'));
      return;
    }
    if (isEdit && !status) {
      setSubmitError(t('accommodation.status.required'));
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const parsedRent = defaultRent.trim() ? Number(defaultRent.trim()) : null;
      const parsedDeposit = defaultDeposit.trim() ? Number(defaultDeposit.trim()) : null;
      const catalogFields = isEdit
        ? {
            defaultRent: parsedRent != null && Number.isFinite(parsedRent) ? parsedRent : null,
            defaultDeposit:
              parsedDeposit != null && Number.isFinite(parsedDeposit) ? parsedDeposit : null,
          }
        : undefined;

      if (isEdit && bedId && status) {
        await accommodationApi.updateBed(spaceId, roomId, bedId, {
          name: name.trim(),
          bedNumber: bedNumber.trim(),
          status,
          ...catalogFields,
        });
        showToast(t('accommodation.beds.updateSuccess'));
      } else {
        await accommodationApi.createBed(spaceId, roomId, {
          name: name.trim(),
          bedNumber: bedNumber.trim(),
          status: status ?? 'AVAILABLE',
        });
        showToast(t('accommodation.beds.createSuccess'));
      }
      navigation.goBack();
    } catch (err) {
      setSubmitError(getAccommodationErrorMessage(err, 'accommodation.errors.saveBed'));
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
            {!isEdit ? <PricingAfterCreateHint entityKey="bed" /> : null}
            <FormInput label={t('accommodation.fields.name')} value={name} onChangeText={setName} />
            <FormInput
              label={t('accommodation.beds.bedNumberLabel')}
              value={bedNumber}
              onChangeText={setBedNumber}
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
                  placeholder={t('occupancy.contract.amountPlaceholder')}
                />
                <FormInput
                  label={t('accommodation.fields.defaultDeposit')}
                  value={defaultDeposit}
                  onChangeText={setDefaultDeposit}
                  keyboardType="numeric"
                  placeholder="0"
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
