import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { FoodItemResponse } from '../../api/types';
import { FoodItemMultiPicker } from '../../components/meals/FoodItemMultiPicker';
import { Button, FormInput, PermissionDeniedScreen } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = NativeStackScreenProps<MainStackParamList, 'MealComboForm'>['route'];

export function MealComboFormScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, mode, comboId } = route.params;
  const permissions = useSpacePermissions(spaceId);
  const showToast = useToastStore(state => state.showToast);

  const isEdit = mode === 'edit';

  const [items, setItems] = useState<FoodItemResponse[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [itemList, comboList] = await Promise.all([
          mealsApi.getFoodItems(spaceId),
          mealsApi.getMealCombos(spaceId),
        ]);
        setItems(itemList);

        if (isEdit && comboId) {
          const combo = comboList.find(row => row.comboId === comboId);
          if (combo) {
            setName(combo.name);
            setDescription(combo.description ?? '');
            setSelectedItemIds(combo.items?.map(item => item.itemId) ?? []);
          }
        }
      } catch {
        setSubmitError(t('meals.errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    })();
  }, [comboId, isEdit, spaceId, t]);

  const submit = useCallback(async () => {
    Keyboard.dismiss();
    let valid = true;

    if (!name.trim()) {
      setNameError(t('meals.library.comboNameRequired'));
      valid = false;
    } else {
      setNameError(null);
    }

    if (selectedItemIds.length === 0) {
      setItemsError(t('meals.library.comboItemsRequired'));
      valid = false;
    } else {
      setItemsError(null);
    }

    if (!valid) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const body = {
      name: name.trim(),
      description: description.trim() || null,
      itemIds: selectedItemIds,
    };

    try {
      if (isEdit && comboId) {
        await mealsApi.updateMealCombo(spaceId, comboId, body);
        showToast(t('meals.library.comboUpdateSuccess'));
      } else {
        await mealsApi.createMealCombo(spaceId, body);
        showToast(t('meals.library.comboCreateSuccess'));
      }
      navigation.goBack();
    } catch {
      setSubmitError(t('meals.errors.saveComboFailed'));
    } finally {
      setSubmitting(false);
    }
  }, [comboId, description, isEdit, name, navigation, selectedItemIds, showToast, spaceId, t]);

  if (!permissions.canManageMeals) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  if (loading) {
    return (
      <Screen contentStyle={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <Text style={styles.subtitle}>{t('meals.library.addComboHint')}</Text>

          <FormInput
            label={t('meals.library.comboNameLabel')}
            value={name}
            onChangeText={text => {
              setName(text);
              if (nameError) {
                setNameError(null);
              }
            }}
            error={nameError}
            placeholder={t('meals.library.comboNamePlaceholder')}
          />

          <FormInput
            label={t('meals.library.comboDescriptionLabel')}
            value={description}
            onChangeText={setDescription}
            placeholder={t('meals.library.comboDescriptionPlaceholder')}
          />

          <FoodItemMultiPicker
            items={items}
            selectedIds={selectedItemIds}
            onChange={setSelectedItemIds}
            error={itemsError}
          />

          {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
          <Button label={t('common.save')} onPress={submit} loading={submitting} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.xxl,
    paddingBottom: spacing.section,
  },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  error: { ...typography.caption, color: '#DC2626', marginBottom: spacing.md },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
