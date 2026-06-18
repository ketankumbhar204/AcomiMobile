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
  canAddCategory?: boolean;
  categories?: FoodCategoryResponse[];
  onAddItem?: (categoryId: string, name: string) => Promise<FoodItemResponse>;
  onAddCategory?: (name: string) => Promise<FoodCategoryResponse>;
  variant?: 'default' | 'planning';
};

export function FoodItemMultiPicker({
  items,
  selectedIds,
  onChange,
  error,
  canAddItem = false,
  canAddCategory = false,
  categories = [],
  onAddItem,
  onAddCategory,
  variant = 'default',
}: FoodItemMultiPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [addingCategoryId, setAddingCategoryId] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

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
  const showAddCategory = canAddCategory && onAddCategory;

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

  async function saveNewCategory(name: string) {
    if (!onAddCategory) {
      return;
    }
    try {
      const created = await onAddCategory(name);
      setSelectedCategoryId(created.categoryId);
      setIsAddingCategory(false);
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

        {activeCategories.length > 0 || showAddCategory ? (
          <ScrollableChipRail>
            {activeCategories.map(category => (
              <MenuChip
                key={category.categoryId}
                label={category.name}
                variant="filter"
                selected={effectiveCategoryId === category.categoryId}
                onPress={() => {
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
              onPress={() => {
                setAddingCategoryId(effectiveCategoryId);
                setIsAddingCategory(false);
              }}
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

  // Default: all items grouped by category section headers
  const groupedSections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const sections: Array<{ categoryId: string; name: string; items: FoodItemResponse[] }> = [];

    for (const category of activeCategories) {
      const categoryItems = activeItems.filter(item => item.categoryId === category.categoryId);
      const visible = normalized
        ? categoryItems.filter(item => item.name.toLowerCase().includes(normalized))
        : categoryItems;
      if (visible.length > 0) {
        sections.push({
          categoryId: category.categoryId,
          name: category.name,
          items: visible,
        });
      }
    }

    const uncategorized = activeItems.filter(
      item => !activeCategories.some(category => category.categoryId === item.categoryId),
    );
    const visibleUncategorized = normalized
      ? uncategorized.filter(item => item.name.toLowerCase().includes(normalized))
      : uncategorized;
    if (visibleUncategorized.length > 0) {
      sections.push({
        categoryId: '__uncategorized__',
        name: t('meals.library.uncategorized'),
        items: visibleUncategorized,
      });
    }

    if (sections.length === 0 && activeCategories.length === 0) {
      const visible = normalized
        ? activeItems.filter(item => item.name.toLowerCase().includes(normalized))
        : activeItems;
      if (visible.length > 0) {
        sections.push({
          categoryId: '__all__',
          name: t('meals.library.items'),
          items: visible,
        });
      }
    }

    return sections;
  }, [activeCategories, activeItems, query, t]);

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
      {groupedSections.map(section => (
        <View key={section.categoryId} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>
            {t('meals.library.comboCategoryTitle', {
              category: section.name,
              total: section.items.length,
            })}
          </Text>
          <View style={styles.chipGrid}>
            {section.items.map(item => (
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
        </View>
      ))}
      {groupedSections.length === 0 ? (
        <Text style={styles.empty}>{t('meals.library.itemsEmpty')}</Text>
      ) : null}
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
  categorySection: {
    marginBottom: spacing.md,
  },
  categoryTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
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
