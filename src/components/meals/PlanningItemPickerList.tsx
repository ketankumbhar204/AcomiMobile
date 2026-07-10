import React, { useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FoodCategoryResponse, FoodItemResponse, FoodType } from '../../api/types';
import { FoodTypePicker } from '../ui/FoodTypePicker';
import { colors, radius, spacing, typography } from '../../theme';
import { getEffectivePriceDraft } from '../../utils/comboPrice';
import { comboPriceDraftErrorMessage, type ComboPriceDraftErrors } from '../../utils/comboSelectionPricing';
import { ComboPickerCard } from './ComboPickerCard';
import { InlineChipEditor } from './library/InlineChipEditor';
import { ScrollableChipRail } from './library/ScrollableChipRail';
import { MenuChip } from './library/MenuChip';

type PlanningItemPickerListProps = {
  items: FoodItemResponse[];
  categories: FoodCategoryResponse[];
  selectedIds: string[];
  searchQuery: string;
  draftPrices: Record<string, string>;
  priceErrors: ComboPriceDraftErrors;
  onToggle: (itemId: string) => void;
  onPriceChange: (itemId: string, text: string) => void;
  onPriceBlur?: (item: FoodItemResponse, draftValue: string) => void;
  showMealPrices?: boolean;
  canAddItem?: boolean;
  canAddCategory?: boolean;
  onAddItem?: (categoryId: string, name: string, foodType?: FoodType) => Promise<FoodItemResponse>;
  onAddCategory?: (name: string) => Promise<FoodCategoryResponse>;
};

export function PlanningItemPickerList({
  items,
  categories,
  selectedIds,
  searchQuery,
  draftPrices,
  priceErrors,
  onToggle,
  onPriceChange,
  onPriceBlur,
  showMealPrices = true,
  canAddItem = false,
  canAddCategory = false,
  onAddItem,
  onAddCategory,
}: PlanningItemPickerListProps) {
  const { t } = useTranslation();
  const [addingCategoryId, setAddingCategoryId] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [draftFoodType, setDraftFoodType] = useState<FoodType>('VEG');

  const activeCategories = useMemo(
    () => categories.filter(category => category.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const activeItems = useMemo(() => items.filter(item => item.isActive), [items]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    activeCategories[0]?.categoryId ?? null,
  );

  const effectiveCategoryId = selectedCategoryId ?? activeCategories[0]?.categoryId ?? null;

  const categoryItems = useMemo(() => {
    if (!effectiveCategoryId) {
      return activeItems;
    }
    return activeItems.filter(item => item.categoryId === effectiveCategoryId);
  }, [activeItems, effectiveCategoryId]);

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return categoryItems;
    }
    return categoryItems.filter(item => item.name.toLowerCase().includes(query));
  }, [categoryItems, searchQuery]);

  const showAddItem = canAddItem && onAddItem;
  const showAddCategory = canAddCategory && onAddCategory;

  async function saveNewCategory(name: string) {
    if (!onAddCategory) {
      return;
    }
    try {
      const created = await onAddCategory(name);
      setSelectedCategoryId(created.categoryId);
      setIsAddingCategory(false);
      setAddingCategoryId(null);
    } catch {
      // Parent shows toast
    }
  }

  async function saveNewItem(categoryId: string, name: string) {
    if (!onAddItem) {
      return;
    }
    try {
      const created = await onAddItem(categoryId, name, draftFoodType);
      if (!selectedIds.includes(created.itemId)) {
        onToggle(created.itemId);
      }
      setAddingCategoryId(null);
      setDraftFoodType('VEG');
    } catch {
      // Parent shows toast
    }
  }

  return (
    <View style={styles.wrapper}>
      {activeCategories.length > 0 || showAddCategory ? (
        <View style={styles.categorySection}>
          <Text style={styles.categoryLabel}>{t('meals.planning.itemCategoriesLabel')}</Text>
          <ScrollableChipRail>
            {activeCategories.map(category => (
              <MenuChip
                key={category.categoryId}
                label={category.name}
                variant="filter"
                selected={effectiveCategoryId === category.categoryId}
                onPress={() => {
                  Keyboard.dismiss();
                  setSelectedCategoryId(category.categoryId);
                  setIsAddingCategory(false);
                }}
              />
            ))}
            {showAddCategory && !isAddingCategory ? (
              <MenuChip
                label={t('meals.library.chipAddCategory')}
                variant="add"
                onPress={() => {
                  setIsAddingCategory(true);
                  setAddingCategoryId(null);
                }}
              />
            ) : null}
          </ScrollableChipRail>
        </View>
      ) : null}

      {showAddCategory && isAddingCategory ? (
        <View style={styles.editorRow}>
          <InlineChipEditor
            placeholder={t('meals.library.categoryNameInlinePlaceholder')}
            onSave={saveNewCategory}
            onCancel={() => setIsAddingCategory(false)}
            layout="full"
          />
        </View>
      ) : null}

      <Text style={styles.itemsLabel}>{t('meals.library.items')}</Text>

      {visibleItems.length === 0 && !showAddItem ? (
        <Text style={styles.empty}>{t('meals.library.itemsEmpty')}</Text>
      ) : (
        visibleItems.map(item => {
          const selected = selectedIds.includes(item.itemId);
          const errorKey = priceErrors[item.itemId];
          const priceDraft = getEffectivePriceDraft(
            item.itemId,
            draftPrices,
            item.defaultPrice ?? null,
          );
          return (
            <ComboPickerCard
              key={item.itemId}
              name={item.name}
              itemNames={[]}
              foodType={item.foodType ?? 'VEG'}
              price={item.defaultPrice ?? null}
              currencyCode={item.currencyCode ?? 'INR'}
              selected={selected}
              editablePrice={selected && showMealPrices}
              requiresPriceInput={selected && showMealPrices}
              showMealPrices={showMealPrices}
              priceDraft={priceDraft}
              onPriceDraftChange={text => onPriceChange(item.itemId, text)}
              onPriceBlur={
                selected
                  ? draft => {
                      onPriceBlur?.(item, draft);
                    }
                  : undefined
              }
              priceInputError={
                errorKey ? comboPriceDraftErrorMessage(errorKey, t) : null
              }
              onPress={() => onToggle(item.itemId)}
            />
          );
        })
      )}

      {showAddItem && effectiveCategoryId && addingCategoryId !== effectiveCategoryId ? (
        <Pressable
          style={styles.addItemRow}
          onPress={() => {
            setAddingCategoryId(effectiveCategoryId);
            setIsAddingCategory(false);
          }}>
          <MenuChip
            label={t('meals.library.chipAddItem')}
            variant="add"
            onPress={() => {
              setAddingCategoryId(effectiveCategoryId);
              setIsAddingCategory(false);
            }}
          />
        </Pressable>
      ) : null}

      {showAddItem && effectiveCategoryId && addingCategoryId === effectiveCategoryId ? (
        <View style={styles.editorRow}>
          <InlineChipEditor
            placeholder={t('meals.library.itemNameInlinePlaceholder')}
            onSave={name => saveNewItem(effectiveCategoryId, name)}
            onCancel={() => {
              setAddingCategoryId(null);
              setDraftFoodType('VEG');
            }}
            layout="full"
          />
          <FoodTypePicker value={draftFoodType} onChange={setDraftFoodType} compact />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.xs,
  },
  categorySection: {
    marginBottom: spacing.md,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  itemsLabel: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  addItemRow: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  editorRow: {
    width: '100%',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
  },
});
