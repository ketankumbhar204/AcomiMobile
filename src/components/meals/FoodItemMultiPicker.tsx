import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FoodCategoryResponse, FoodItemResponse } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { InlineChipEditor } from './library/InlineChipEditor';
import { MenuChip } from './library/MenuChip';
import { ScrollableChipRail } from './library/ScrollableChipRail';

type FoodItemMultiPickerProps = {
  items: FoodItemResponse[];
  selectedIds: string[];
  onChange: (itemIds: string[]) => void;
  error?: string | null;
  canAddItem?: boolean;
  categories?: FoodCategoryResponse[];
  onAddItem?: (categoryId: string, name: string) => Promise<FoodItemResponse>;
  variant?: 'default' | 'planning';
};

export function FoodItemMultiPicker({
  items,
  selectedIds,
  onChange,
  error,
  canAddItem = false,
  categories = [],
  onAddItem,
  variant = 'default',
}: FoodItemMultiPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [addingCategoryId, setAddingCategoryId] = useState<string | null>(null);

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

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return categoryItems;
    }
    return categoryItems.filter(item => item.name.toLowerCase().includes(normalized));
  }, [categoryItems, query]);

  const showAddItem = canAddItem && onAddItem;

  function toggleItem(itemId: string) {
    if (selectedIds.includes(itemId)) {
      onChange(selectedIds.filter(id => id !== itemId));
      return;
    }
    onChange([...selectedIds, itemId]);
  }

  async function saveNewItem(categoryId: string, name: string) {
    if (!onAddItem) {
      return;
    }
    try {
      const created = await onAddItem(categoryId, name);
      onChange(
        selectedIds.includes(created.itemId) ? selectedIds : [...selectedIds, created.itemId],
      );
      setAddingCategoryId(null);
      setQuery('');
    } catch {
      // Parent shows toast
    }
  }

  if (variant === 'planning') {
    const selectedCategory = activeCategories.find(
      category => category.categoryId === effectiveCategoryId,
    );

    return (
      <View style={styles.wrapper}>
        <Text style={styles.sectionLabel}>{t('meals.library.items')}</Text>

        {activeCategories.length > 0 ? (
          <ScrollableChipRail>
            {activeCategories.map(category => (
              <MenuChip
                key={category.categoryId}
                label={category.name}
                variant="filter"
                selected={effectiveCategoryId === category.categoryId}
                onPress={() => setSelectedCategoryId(category.categoryId)}
              />
            ))}
          </ScrollableChipRail>
        ) : null}

        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder={t('meals.menu.searchInCategory', {
            category: selectedCategory?.name ?? t('meals.library.items'),
          })}
          placeholderTextColor={colors.muted}
        />

        <View style={styles.chipGrid}>
          {filteredItems.map(item => (
            <MenuChip
              key={item.itemId}
              label={item.name}
              variant="item"
              size="compact"
              selected={selectedIds.includes(item.itemId)}
              isCustom={item.isCustom}
              onPress={() => toggleItem(item.itemId)}
            />
          ))}
          {showAddItem && effectiveCategoryId && addingCategoryId !== effectiveCategoryId ? (
            <MenuChip
              label={t('meals.library.chipAddItem')}
              variant="add"
              size="compact"
              onPress={() => setAddingCategoryId(effectiveCategoryId)}
            />
          ) : null}
        </View>

        {showAddItem && effectiveCategoryId && addingCategoryId === effectiveCategoryId ? (
          <View style={styles.editorRow}>
            <InlineChipEditor
              placeholder={t('meals.library.itemNameInlinePlaceholder')}
              onSave={name => saveNewItem(effectiveCategoryId, name)}
              onCancel={() => setAddingCategoryId(null)}
              layout="full"
            />
          </View>
        ) : null}

        {filteredItems.length === 0 ? (
          <Text style={styles.empty}>{t('meals.library.itemsEmpty')}</Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  // Default: grouped grid (combo form, etc.)
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('meals.library.comboItemsLabel')}</Text>
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder={t('meals.library.searchItems')}
        placeholderTextColor={colors.muted}
      />
      <View style={styles.chipGrid}>
        {filteredItems.map(item => (
          <MenuChip
            key={item.itemId}
            label={item.name}
            variant="item"
            size="compact"
            selected={selectedIds.includes(item.itemId)}
            isCustom={item.isCustom}
            onPress={() => toggleItem(item.itemId)}
          />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.xxs },
  sectionLabel: { ...typography.bodyStrong, marginBottom: spacing.sm },
  search: {
    ...typography.body,
    fontSize: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 36,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  editorRow: {
    width: '100%',
    marginTop: spacing.xs,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  error: { ...typography.caption, color: '#DC2626', marginTop: spacing.xs },
});
