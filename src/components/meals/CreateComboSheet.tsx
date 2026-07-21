import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { FoodCategoryResponse, FoodItemResponse, FoodType, UUID } from '../../api/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { MenuDraftOption } from '../../utils/dailyMenuDraft';
import { nextComboName } from '../../utils/comboNaming';
import { parsePriceInput, validatePriceInput } from '../../utils/comboPrice';
import {
  buildItemQuantitiesPayload,
  syncItemQuantities,
} from '../../utils/comboIncludes';
import { fetchSpaceMenuCatalog } from '../../utils/fetchSpaceMenuCatalog';
import { useMealPricingPolicy } from '../../hooks/useMealPricingPolicy';
import { ComboItemQuantityEditor } from './ComboItemQuantityEditor';
import { ComboPriceInput } from './ComboPriceInput';
import { FoodItemMultiPicker } from './FoodItemMultiPicker';
import { MenuPlanningBottomSheet, SheetPrimaryButton } from './MenuPlanningBottomSheet';
import { PlanningSelectionSection } from './PlanningSelectionSection';

type CreateComboSheetProps = {
  visible: boolean;
  spaceId: UUID;
  existingOptions: MenuDraftOption[];
  onClose: () => void;
  onBack?: () => void;
  onSave: (
    name: string,
    itemIds: string[],
    saveToLibrary: boolean,
    price?: number | null,
    itemQuantities?: Array<{ itemId: string; quantity: number }>,
  ) => Promise<void>;
  submitLabel?: string;
};

export function CreateComboSheet({
  visible,
  spaceId,
  existingOptions,
  onClose,
  onBack,
  onSave,
  submitLabel,
}: CreateComboSheetProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const mealPricing = useMealPricingPolicy(spaceId);
  const enableItemQuantities = mealPricing.requiresMealPrices;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [foodItems, setFoodItems] = useState<FoodItemResponse[]>([]);
  const [categories, setCategories] = useState<FoodCategoryResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [comboName, setComboName] = useState('');
  const [suggestedName, setSuggestedName] = useState('Combo 1');
  const [priceText, setPriceText] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);
  const [saveToLibrary, setSaveToLibrary] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPriceText('');
    setPriceError(null);
    setSelectedIds([]);
    setItemQuantities({});
    setSaveToLibrary(false);

    let active = true;
    setLoading(true);
    void fetchSpaceMenuCatalog(spaceId)
      .then(catalog => {
        if (!active) return;
        setFoodItems(catalog.items.filter(i => i.isActive));
        setCategories(catalog.categories.filter(c => c.isActive));
        const labels = [
          ...existingOptions.map(option => option.label),
          ...catalog.combos.filter(combo => combo.isActive).map(combo => combo.name),
        ];
        const name = nextComboName(labels);
        setSuggestedName(name);
        setComboName(name);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible, spaceId, existingOptions]);

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map(id => foodItems.find(item => item.itemId === id))
        .filter((item): item is FoodItemResponse => item != null),
    [selectedIds, foodItems],
  );

  const addItemInline = useCallback(
    async (categoryId: string, itemName: string, foodType: FoodType = 'VEG') => {
      try {
        const created = await mealsApi.createFoodItem(spaceId, {
          categoryId,
          name: itemName,
          foodType,
        });
        setFoodItems(current => [...current, created]);
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

  const handleSave = async () => {
    if (selectedItems.length === 0) return;
    const validation = validatePriceInput(priceText);
    if (validation) {
      setPriceError(
        validation === 'nonPositive'
          ? t('meals.pricing.priceMustBePositive')
          : t('meals.pricing.priceInvalid'),
      );
      return;
    }
    const name = comboName.trim() || suggestedName;
    const price = parsePriceInput(priceText);
    setSaving(true);
    try {
      await onSave(
        name,
        selectedItems.map(i => i.itemId),
        saveToLibrary,
        price,
        enableItemQuantities
          ? buildItemQuantitiesPayload(selectedIds, itemQuantities)
          : undefined,
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <MenuPlanningBottomSheet
      visible={visible}
      title={t('meals.planning.createNewComboTitle')}
      onClose={onClose}
      onBack={onBack}
      footer={
        <SheetPrimaryButton
          label={saving ? t('common.saving') : (submitLabel ?? t('meals.planning.addComboToMeal'))}
          onPress={() => void handleSave()}
          disabled={selectedItems.length === 0}
          loading={saving}
        />
      }>
      <Text style={styles.fieldLabel}>{t('meals.planning.comboNameLabel')}</Text>
      <TextInput
        style={styles.nameInput}
        value={comboName}
        onChangeText={setComboName}
        placeholder={suggestedName}
        returnKeyType="done"
      />

      <ComboPriceInput
        value={priceText}
        onChangeText={text => {
          setPriceText(text);
          if (priceError) setPriceError(null);
        }}
        error={priceError}
      />

      <PlanningSelectionSection
        title={t('meals.planning.comboItemsLabel')}
        countLabel={
          selectedItems.length > 0
            ? t('meals.planning.selectedCount', { count: selectedItems.length })
            : undefined
        }
        chips={selectedItems.map(item => ({
          id: item.itemId,
          label: item.name,
          variant: 'ITEM',
        }))}
        onRemove={id => {
          setSelectedIds(prev => {
            const next = prev.filter(x => x !== id);
            setItemQuantities(current => syncItemQuantities(current, next));
            return next;
          });
        }}
        emptyText={t('meals.planning.noItemsSelected')}
      />

      {enableItemQuantities && selectedIds.length > 0 ? (
        <View style={styles.quantitySection}>
          <Text style={styles.quantityTitle}>{t('meals.combo.itemQuantitiesTitle')}</Text>
          <ComboItemQuantityEditor
            items={foodItems}
            selectedIds={selectedIds}
            quantities={itemQuantities}
            onQuantityChange={(itemId, quantity) =>
              setItemQuantities(prev => ({ ...prev, [itemId]: quantity }))
            }
          />
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FoodItemMultiPicker
          items={foodItems}
          categories={categories}
          selectedIds={selectedIds}
          onChange={ids => {
            setSelectedIds(ids);
            setItemQuantities(prev => syncItemQuantities(prev, ids));
          }}
          variant="planning"
          canAddItem
          canAddCategory
          onAddItem={addItemInline}
          onAddCategory={addCategoryInline}
        />
      )}

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleLabel}>{t('meals.planning.saveToLibraryLabel')}</Text>
          <Text style={styles.toggleHint}>{t('meals.planning.saveToLibraryHint')}</Text>
        </View>
        <Switch
          value={saveToLibrary}
          onValueChange={setSaveToLibrary}
          trackColor={{ true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>
    </MenuPlanningBottomSheet>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  quantitySection: {
    marginTop: spacing.md,
  },
  quantityTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    backgroundColor: colors.surface,
    ...typography.body,
    marginBottom: spacing.xs,
  },
  loader: { marginVertical: spacing.lg },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  toggleText: { flex: 1 },
  toggleLabel: { ...typography.bodyStrong },
  toggleHint: { ...typography.caption, color: colors.muted, marginTop: spacing.xxs },
});
