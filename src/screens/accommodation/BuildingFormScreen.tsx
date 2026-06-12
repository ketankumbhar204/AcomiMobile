import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
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
import type { PropertyLayoutMode, SpaceType } from '../../api/types';
import { PropertyLayoutModePicker } from '../../components/accommodation';
import { Button, FormInput, HeaderBackButton } from '../../components/ui';
import type { MainStackParamList } from '../../navigation/types';
import { useSpaceStore } from '../../store/spaceStore';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { getAccommodationErrorMessage } from '../../utils/accommodationErrors';
import { defaultLayoutModeForSpaceType } from '../../utils/accommodationProfile';
import {
  getLayoutModeLabelKey,
  isLayoutModeSelectable,
  layoutModesForSpaceType,
} from '../../utils/propertyLayoutMode';

type Nav = NativeStackNavigationProp<MainStackParamList, 'BuildingForm'>;
type Route = NativeStackScreenProps<MainStackParamList, 'BuildingForm'>['route'];

export function BuildingFormScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, mode, buildingId } = route.params;
  const isEdit = mode === 'edit';
  const showToast = useToastStore(state => state.showToast);

  const mySpaces = useSpaceStore(state => state.mySpaces);
  const spaceType = useMemo(
    () => mySpaces.find(space => space.spaceId === spaceId)?.spaceType as SpaceType | undefined,
    [mySpaces, spaceId],
  );
  const layoutModeOptions = useMemo(
    () => (spaceType ? layoutModesForSpaceType(spaceType) : []),
    [spaceType],
  );

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [layoutMode, setLayoutMode] = useState<PropertyLayoutMode>('CORRIDOR_PG');
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (spaceType) {
      setLayoutMode(defaultLayoutModeForSpaceType(spaceType));
    }
  }, [spaceType]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEdit
        ? t('accommodation.buildings.editTitle')
        : t('accommodation.buildings.createTitle'),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [isEdit, navigation, t, i18n.language]);

  useFocusEffect(
    useCallback(() => {
      if (!isEdit || !buildingId) return;
      accommodationApi.getBuilding(spaceId, buildingId).then(building => {
        setName(building.name);
        setCode(building.code ?? '');
        setLayoutMode(building.layoutMode);
      }).catch(err => {
        setSubmitError(getAccommodationErrorMessage(err));
      });
    }, [buildingId, isEdit, spaceId]),
  );

  async function handleSubmit() {
    Keyboard.dismiss();
    if (!name.trim()) {
      setNameError(t('accommodation.buildings.nameRequired'));
      return;
    }
    setNameError(null);
    setSubmitting(true);
    setSubmitError(null);

    try {
      const body = {
        name: name.trim(),
        code: code.trim() || undefined,
        layoutMode,
      };
      if (isEdit && buildingId) {
        await accommodationApi.updateBuilding(spaceId, buildingId, body);
        showToast(t('accommodation.buildings.updateSuccess'));
      } else {
        await accommodationApi.createBuilding(spaceId, body);
        showToast(t('accommodation.buildings.createSuccess'));
      }
      navigation.goBack();
    } catch (err) {
      setSubmitError(getAccommodationErrorMessage(err, 'accommodation.errors.saveBuilding'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FormInput
            label={t('accommodation.fields.name')}
            value={name}
            onChangeText={setName}
            placeholder={t('accommodation.buildings.namePlaceholder')}
            error={nameError}
          />
          <FormInput
            label={t('accommodation.fields.code')}
            value={code}
            onChangeText={setCode}
            placeholder={t('accommodation.buildings.codePlaceholder')}
          />
          {spaceType && isLayoutModeSelectable(spaceType) ? (
            <PropertyLayoutModePicker
              value={layoutMode}
              onChange={setLayoutMode}
              options={layoutModeOptions}
            />
          ) : spaceType ? (
            <Text style={styles.fixedLayout}>
              {t('accommodation.layoutMode.label')}: {t(getLayoutModeLabelKey(layoutMode))}
            </Text>
          ) : null}
          {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
          <Button
            label={t('common.save')}
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submit}
          />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, paddingBottom: spacing.section },
  fixedLayout: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  errorText: { ...typography.body, color: '#DC2626', marginBottom: spacing.md },
  submit: { marginTop: spacing.sm },
});
