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
import { formatSpaceType } from '../api';
import { mealBillingApi } from '../api/mealBillingApi';
import type { MealBillingType, PrepaidBalanceUnit } from '../api/types';
import { Button, Card, FormInput, HeaderBackButton, useConfirmDialog } from '../components/ui';
import {
  MealBillingSettingsSection,
  type MealBillingSettingsFormValues,
} from '../components/settings/MealBillingSettingsSection';
import { useDeactivateSpace } from '../hooks/useDeactivateSpace';
import { useAuthenticatedUserId } from '../hooks/useAuth';
import type { MainStackParamList } from '../navigation/types';
import { useSpaceStore } from '../store/spaceStore';
import { colors, spacing, typography } from '../theme';
import { isSpaceOwner } from '../utils/spaceOwnership';

type EditSpaceNav = NativeStackNavigationProp<MainStackParamList, 'EditSpace'>;
type EditSpaceRoute = NativeStackScreenProps<MainStackParamList, 'EditSpace'>['route'];

type FieldErrors = {
  name?: string;
};

const DEFAULT_BILLING: MealBillingSettingsFormValues = {
  billingType: 'PAY_PER_MEAL',
  prepaidBalanceUnit: 'MEALS',
  fallbackToPayPerMeal: true,
};

function billingFromSpace(
  mealBillingType?: MealBillingType,
  prepaidBalanceUnit?: PrepaidBalanceUnit | null,
  prepaidFallbackToPayPerMeal?: boolean,
): MealBillingSettingsFormValues {
  return {
    billingType: mealBillingType ?? 'PAY_PER_MEAL',
    prepaidBalanceUnit: prepaidBalanceUnit ?? 'MEALS',
    fallbackToPayPerMeal: prepaidFallbackToPayPerMeal ?? true,
  };
}

function billingChanged(
  current: MealBillingSettingsFormValues,
  initial: MealBillingSettingsFormValues,
): boolean {
  return (
    current.billingType !== initial.billingType ||
    current.prepaidBalanceUnit !== initial.prepaidBalanceUnit ||
    current.fallbackToPayPerMeal !== initial.fallbackToPayPerMeal
  );
}

export function EditSpaceScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<EditSpaceNav>();
  const route = useRoute<EditSpaceRoute>();
  const { spaceId } = route.params;
  const currentUserId = useAuthenticatedUserId();
  const { confirmDeactivate, isLoading: isDeactivating } = useDeactivateSpace();
  const { showConfirm } = useConfirmDialog();

  const loadSpaceDetails = useSpaceStore(state => state.loadSpaceDetails);
  const updateSpace = useSpaceStore(state => state.updateSpace);
  const selectedSpace = useSpaceStore(state => state.selectedSpace);
  const isLoading = useSpaceStore(state => state.loading);
  const error = useSpaceStore(state => state.error);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [typeLabel, setTypeLabel] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billingValues, setBillingValues] = useState<MealBillingSettingsFormValues>(DEFAULT_BILLING);
  const [initialBillingValues, setInitialBillingValues] =
    useState<MealBillingSettingsFormValues>(DEFAULT_BILLING);
  const [spaceType, setSpaceType] = useState<string | null>(null);

  const owner = isSpaceOwner(selectedSpace, currentUserId);
  const isMessSpace = spaceType === 'MESS';

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('navigation.editSpace'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      console.log('[EditSpace] screen focused', { spaceId });

      loadSpaceDetails(spaceId).then(async loaded => {
        if (loaded) {
          setName(loaded.name);
          setAddress(loaded.address ?? '');
          setContactNumber(loaded.contactNumber ?? '');
          setTypeLabel(formatSpaceType(loaded.type));
          setSpaceType(loaded.type);

          if (loaded.type === 'MESS') {
            try {
              const settings = await mealBillingApi.getSettings(spaceId);
              const next = billingFromSpace(
                settings.billingType,
                settings.prepaidBalanceUnit,
                settings.fallbackToPayPerMeal,
              );
              setBillingValues(next);
              setInitialBillingValues(next);
            } catch {
              const fallback = billingFromSpace(
                loaded.mealBillingType,
                loaded.prepaidBalanceUnit,
                loaded.prepaidFallbackToPayPerMeal,
              );
              setBillingValues(fallback);
              setInitialBillingValues(fallback);
            }
          }
        }
      });
    }, [loadSpaceDetails, spaceId]),
  );

  function validate(): boolean {
    const errors: FieldErrors = {};
    if (!name.trim()) {
      errors.name = t('spaces.editSpace.nameRequired');
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    Keyboard.dismiss();

    if (!validate()) {
      return;
    }

    console.log('[EditSpace] save started', { spaceId });
    setIsSubmitting(true);

    const updated = await updateSpace(spaceId, {
      name: name.trim(),
      address: address.trim() || undefined,
      contactNumber: contactNumber.trim() || undefined,
    });

    if (!updated) {
      setIsSubmitting(false);
      return;
    }

    if (isMessSpace && owner && billingChanged(billingValues, initialBillingValues)) {
      try {
        await mealBillingApi.updateSettings(spaceId, {
          billingType: billingValues.billingType,
          prepaidBalanceUnit:
            billingValues.billingType === 'PREPAID_BALANCE'
              ? billingValues.prepaidBalanceUnit
              : null,
          fallbackToPayPerMeal: billingValues.fallbackToPayPerMeal,
        });
        setInitialBillingValues(billingValues);
      } catch {
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(false);

    if (updated) {
      console.log('[EditSpace] save success', updated.id);
      const goBack = () => navigation.goBack();
      showConfirm({
        title: t('spaces.editSpace.successTitle'),
        message: t('spaces.editSpace.successMessage'),
        confirmLabel: t('common.ok'),
        hideCancel: true,
        onConfirm: goBack,
        onDismiss: goBack,
      });
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <Text style={styles.eyebrow}>{t('spaces.editSpace.eyebrow')}</Text>
          <Text style={styles.heading}>{t('spaces.editSpace.heading')}</Text>
          <Text style={styles.subheading}>{t('spaces.editSpace.subheading')}</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <FormInput
            label={t('spaces.createSpace.nameLabel')}
            placeholder={t('spaces.createSpace.namePlaceholder')}
            value={name}
            onChangeText={text => {
              setName(text);
              if (fieldErrors.name) {
                setFieldErrors({});
              }
            }}
            error={fieldErrors.name}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <FormInput
            label={t('spaces.createSpace.addressLabel')}
            placeholder={t('spaces.createSpace.addressPlaceholder')}
            value={address}
            onChangeText={setAddress}
            autoCapitalize="sentences"
            returnKeyType="next"
          />

          <FormInput
            label={t('spaces.createSpace.contactLabel')}
            placeholder={t('spaces.createSpace.contactPlaceholder')}
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
            returnKeyType="done"
            maxLength={15}
          />

          <Card style={styles.readOnlyCard}>
            <Text style={styles.readOnlyLabel}>{t('spaces.editSpace.typeLabel')}</Text>
            <Text style={styles.readOnlyValue}>{typeLabel || '—'}</Text>
          </Card>

          {isMessSpace && owner ? (
            <MealBillingSettingsSection
              values={billingValues}
              onChange={setBillingValues}
              disabled={isSubmitting || isLoading}
            />
          ) : null}

          <View style={styles.footer}>
            <Button
              label={t('spaces.editSpace.save')}
              onPress={handleSave}
              loading={isSubmitting || isLoading}
              disabled={isSubmitting || isLoading || isDeactivating}
            />
            <Button
              label={t('spaces.createSpace.cancel')}
              variant="ghost"
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
              style={styles.cancelButton}
            />
          </View>

          {owner ? (
            <Button
              label={t('spaces.details.deactivate')}
              variant="ghost"
              onPress={() => confirmDeactivate(spaceId, name)}
              loading={isDeactivating}
              disabled={isSubmitting || isLoading || isDeactivating}
              style={styles.deactivateButton}
            />
          ) : null}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xxl,
    paddingBottom: spacing.section,
  },
  eyebrow: {
    ...typography.eyebrow,
    marginBottom: spacing.sm,
  },
  heading: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subheading: {
    ...typography.body,
    marginBottom: spacing.xxl,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    ...typography.body,
    color: '#DC2626',
  },
  readOnlyCard: {
    marginBottom: spacing.lg,
  },
  readOnlyLabel: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  readOnlyValue: {
    ...typography.bodyStrong,
  },
  footer: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  cancelButton: {
    marginTop: spacing.xs,
  },
  deactivateButton: {
    borderColor: '#FECACA',
    marginTop: spacing.lg,
  },
});
