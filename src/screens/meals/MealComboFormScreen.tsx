import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { FoodCategoryResponse, FoodItemResponse, FoodType } from '../../api/types';
import { ComboSelectionReview, FoodItemMultiPicker } from '../../components/meals';
import { ComboPriceInput } from '../../components/meals/ComboPriceInput';
import { Button, FormInput, PermissionDeniedScreen } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { parsePriceInput, validatePriceInput } from '../../utils/comboPrice';

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
  const [categories, setCategories] = useState<FoodCategoryResponse[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceText, setPriceText] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [itemList, categoryList, comboList] = await Promise.all([
          mealsApi.getFoodItems(spaceId),
          mealsApi.getFoodCategories(spaceId),
          mealsApi.getMealCombos(spaceId),
        ]);
        setItems(itemList);
        setCategories(categoryList);

        if (isEdit && comboId) {
          const combo = comboList.find(row => row.comboId === comboId);
          if (combo) {
            setName(combo.name);
            setDescription(combo.description ?? '');
            setPriceText(
              combo.price != null && combo.price > 0 ? String(combo.price) : '',
            );
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

    const priceValidation = validatePriceInput(priceText);
    if (priceValidation) {
      setPriceError(
        priceValidation === 'nonPositive'
          ? t('meals.pricing.priceMustBePositive')
          : t('meals.pricing.priceInvalid'),
      );
      valid = false;
    } else {
      setPriceError(null);
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
      price: parsePriceInput(priceText),
      currencyCode: 'INR',
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
  }, [comboId, description, isEdit, name, navigation, priceText, selectedItemIds, showToast, spaceId, t]);

  const addItemInline = useCallback(
    async (categoryId: string, itemName: string, foodType: FoodType = 'VEG') => {
      try {
        const created = await mealsApi.createFoodItem(spaceId, {
          categoryId,
          name: itemName,
          foodType,
        });
        setItems(current => [...current, created]);
        showToast(t('meals.library.itemCreateSuccess'));
        return created;
      } catch {
        showToast(t('meals.errors.actionFailed'));
        throw new Error('createFoodItem failed');
      }
    },
    [showToast, spaceId, t],
  );

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
      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled
          showsVerticalScrollIndicator>
            <View style={styles.formFields}>
              <FormInput
                size="compact"
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
                size="compact"
                label={t('meals.library.comboDescriptionLabel')}
                value={description}
                onChangeText={setDescription}
                placeholder={t('meals.library.comboDescriptionPlaceholder')}
              />

              <ComboPriceInput
                value={priceText}
                onChangeText={text => {
                  setPriceText(text);
                  if (priceError) setPriceError(null);
                }}
                error={priceError}
              />

            </View>

            <FoodItemMultiPicker
              items={items}
              selectedIds={selectedItemIds}
              onChange={ids => {
                setSelectedItemIds(ids);
                if (itemsError && ids.length > 0) {
                  setItemsError(null);
                }
              }}
              variant="planning"
              canAddItem
              categories={categories}
              onAddItem={addItemInline}
            />
          </ScrollView>

          <View style={styles.footer}>
            <ComboSelectionReview
              comboName={name}
              description={description}
              items={items}
              selectedIds={selectedItemIds}
              onRemoveItem={itemId =>
                setSelectedItemIds(current => current.filter(id => id !== itemId))
              }
              error={itemsError}
            />
            {submitError ? <Text style={styles.footerError}>{submitError}</Text> : null}
            <Button
              label={t('common.save')}
              onPress={submit}
              loading={submitting}
              style={styles.saveButton}
            />
          </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  formFields: {
    marginBottom: spacing.sm,
  },
  footer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerError: {
    ...typography.caption,
    color: '#DC2626',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  saveButton: {
    marginTop: spacing.sm,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
