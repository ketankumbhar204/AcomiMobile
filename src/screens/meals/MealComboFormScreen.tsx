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
import { AlignLeft, Package, Type } from 'lucide-react-native';
import { mealsApi } from '../../api/mealsApi';
import type { FoodCategoryResponse, FoodItemResponse, FoodType } from '../../api/types';
import { ComboSelectionReview, FoodItemMultiPicker, MealFormHero } from '../../components/meals';
import { ComboPriceInput } from '../../components/meals/ComboPriceInput';
import { ComboItemQuantityEditor } from '../../components/meals/ComboItemQuantityEditor';
import { DashboardSectionTitle } from '../../components/dashboard/DashboardSectionTitle';
import { Button, FormInput, PermissionDeniedScreen } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { StickyFormActions } from '../../components/progressive';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { useMealPricingPolicy } from '../../hooks/useMealPricingPolicy';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, shadows, spacing, typography } from '../../theme';
import { parsePriceInput, validatePriceInput } from '../../utils/comboPrice';
import {
  buildItemQuantitiesPayload,
  syncItemQuantities,
} from '../../utils/comboIncludes';
import { fetchSpaceMenuCatalog } from '../../utils/fetchSpaceMenuCatalog';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = NativeStackScreenProps<MainStackParamList, 'MealComboForm'>['route'];

export function MealComboFormScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { spaceId, mode, comboId } = route.params;
  const permissions = useSpacePermissions(spaceId);
  const mealPricing = useMealPricingPolicy(spaceId);
  const showToast = useToastStore(state => state.showToast);
  const enableItemQuantities = mealPricing.requiresMealPrices;

  const isEdit = mode === 'edit';

  const [items, setItems] = useState<FoodItemResponse[]>([]);
  const [categories, setCategories] = useState<FoodCategoryResponse[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceText, setPriceText] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [nameError, setNameError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const catalog = await fetchSpaceMenuCatalog(spaceId);
        setItems(catalog.items);
        setCategories(catalog.categories);

        if (isEdit && comboId) {
          const combo = catalog.combos.find(row => row.comboId === comboId);
          if (combo) {
            setName(combo.name);
            setDescription(combo.description ?? '');
            setPriceText(
              combo.price != null && combo.price > 0 ? String(combo.price) : '',
            );
            setSelectedItemIds(combo.items?.map(item => item.itemId) ?? []);
            const qty: Record<string, number> = {};
            for (const item of combo.items ?? []) {
              qty[item.itemId] = item.quantity != null && item.quantity >= 1 ? item.quantity : 1;
            }
            setItemQuantities(qty);
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
      ...(enableItemQuantities
        ? { itemQuantities: buildItemQuantitiesPayload(selectedItemIds, itemQuantities) }
        : {}),
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
  }, [
    comboId,
    description,
    enableItemQuantities,
    isEdit,
    itemQuantities,
    name,
    navigation,
    priceText,
    selectedItemIds,
    showToast,
    spaceId,
    t,
  ]);

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

  const addCategoryInline = useCallback(
    async (name: string) => {
      try {
        const created = await mealsApi.createFoodCategory(spaceId, { name });
        setCategories(current => [...current, created]);
        showToast(t('meals.library.categoryCreateSuccess'));
        return created;
      } catch {
        showToast(t('meals.errors.actionFailed'));
        throw new Error('createFoodCategory failed');
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
          <MealFormHero
            icon={Package}
            accent="#D97706"
            soft={colors.warningTint}
            border="#FDE68A"
            eyebrow={t('meals.library.combos')}
            heading={
              isEdit
                ? t('meals.library.editCombo')
                : t('meals.planning.createComboTitle')
            }
            subheading={t('meals.library.addComboHint')}
          />

          <View style={styles.formCard}>
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
              leadingIcon={Type}
            />

            <FormInput
              size="compact"
              label={t('meals.library.comboDescriptionLabel')}
              value={description}
              onChangeText={setDescription}
              placeholder={t('meals.library.comboDescriptionPlaceholder')}
              leadingIcon={AlignLeft}
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
              setItemQuantities(prev => syncItemQuantities(prev, ids));
              if (itemsError && ids.length > 0) {
                setItemsError(null);
              }
            }}
            variant="planning"
            canAddItem
            canAddCategory
            categories={categories}
            onAddItem={addItemInline}
            onAddCategory={addCategoryInline}
          />

          {enableItemQuantities && selectedItemIds.length > 0 ? (
            <View style={styles.quantitySection}>
              <DashboardSectionTitle title={t('meals.combo.itemQuantitiesTitle')} />
              <View style={styles.quantityCard}>
                <ComboItemQuantityEditor
                  items={items}
                  selectedIds={selectedItemIds}
                  quantities={itemQuantities}
                  onQuantityChange={(itemId, quantity) =>
                    setItemQuantities(prev => ({ ...prev, [itemId]: quantity }))
                  }
                />
              </View>
            </View>
          ) : null}
        </ScrollView>

        <StickyFormActions>
          <ComboSelectionReview
            comboName={name}
            description={description}
            items={items}
            selectedIds={selectedItemIds}
            onRemoveItem={itemId => {
              setSelectedItemIds(current => {
                const next = current.filter(id => id !== itemId);
                setItemQuantities(prev => syncItemQuantities(prev, next));
                return next;
              });
            }}
            error={itemsError}
          />
          {submitError ? (
            <View style={styles.footerErrorBanner}>
              <Text style={styles.errorBannerText}>{submitError}</Text>
            </View>
          ) : null}
          <Button
            label={t('common.save')}
            onPress={submit}
            loading={submitting}
          />
        </StickyFormActions>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  formCard: {
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.xs,
    ...shadows.sm,
  },
  quantitySection: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  quantityCard: {
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  footerErrorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: spacing.md,
  },
  errorBannerText: {
    ...typography.body,
    color: '#DC2626',
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
