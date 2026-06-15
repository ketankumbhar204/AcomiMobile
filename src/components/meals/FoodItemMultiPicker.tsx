import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FoodCategoryResponse, FoodItemResponse } from '../../api/types';
import { InlineChipEditor } from './library/InlineChipEditor';
import { MenuChip } from './library/MenuChip';
import { colors, radius, spacing, typography } from '../../theme';

type FoodItemMultiPickerProps = {
  items: FoodItemResponse[];
  selectedIds: string[];
  onChange: (itemIds: string[]) => void;
  error?: string | null;
  canAddItem?: boolean;
  categories?: FoodCategoryResponse[];
  onAddItem?: (categoryId: string, name: string) => Promise<FoodItemResponse>;
};

type CategoryGroup = {
  categoryId: string;
  categoryName: string;
  items: FoodItemResponse[];
};

function mergeCategoryGroups(
  categories: FoodCategoryResponse[],
  items: FoodItemResponse[],
  fallbackCategory: string,
): CategoryGroup[] {
  const itemGroups = new Map<string, FoodItemResponse[]>();

  for (const item of items) {
    const list = itemGroups.get(item.categoryId) ?? [];
    list.push(item);
    itemGroups.set(item.categoryId, list);
  }

  const activeCategories = categories
    .filter(category => category.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (activeCategories.length > 0) {
    return activeCategories.map(category => ({
      categoryId: category.categoryId,
      categoryName: category.name,
      items: (itemGroups.get(category.categoryId) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }));
  }

  return Array.from(itemGroups.entries())
    .map(([categoryId, categoryItems]) => ({
      categoryId,
      categoryName: categoryItems[0]?.categoryName?.trim() || fallbackCategory,
      items: categoryItems.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
}

export function FoodItemMultiPicker({
  items,
  selectedIds,
  onChange,
  error,
  canAddItem = false,
  categories = [],
  onAddItem,
}: FoodItemMultiPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [addingCategoryId, setAddingCategoryId] = useState<string | null>(null);

  const activeItems = useMemo(
    () => items.filter(item => item.isActive),
    [items],
  );

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return activeItems;
    }
    return activeItems.filter(
      item =>
        item.name.toLowerCase().includes(normalized) ||
        item.categoryName?.toLowerCase().includes(normalized),
    );
  }, [activeItems, query]);

  const hasSearch = query.trim().length > 0;

  const categoryGroups = useMemo(() => {
    const groups = mergeCategoryGroups(categories, filteredItems, t('meals.library.uncategorized'));
    if (!hasSearch) {
      return groups;
    }
    return groups.filter(
      group =>
        group.items.length > 0 ||
        group.categoryName.toLowerCase().includes(query.trim().toLowerCase()),
    );
  }, [categories, filteredItems, hasSearch, query, t]);

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
        selectedIds.includes(created.itemId)
          ? selectedIds
          : [...selectedIds, created.itemId],
      );
      setAddingCategoryId(null);
      setQuery('');
    } catch {
      // Parent shows toast; keep editor open
    }
  }

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


      <View style={styles.groups}>
        {categoryGroups.map(group => {
          const selectedInGroup = group.items.filter(item => selectedIds.includes(item.itemId)).length;
          const isAddingHere = addingCategoryId === group.categoryId;
          const totalCount = group.items.length;

          return (
            <View key={group.categoryId} style={styles.group}>
              <Text style={styles.groupTitle}>
                {selectedInGroup > 0
                  ? t('meals.library.comboCategorySelected', {
                      category: group.categoryName,
                      selected: selectedInGroup,
                      total: totalCount,
                    })
                  : t('meals.library.comboCategoryTitle', {
                      category: group.categoryName,
                      total: totalCount,
                    })}
              </Text>
              <View style={styles.chipGrid}>
                {group.items.map(item => (
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
                {showAddItem && !isAddingHere ? (
                  <MenuChip
                    label={t('meals.library.chipAddItem')}
                    variant="add"
                    size="compact"
                    onPress={() => setAddingCategoryId(group.categoryId)}
                  />
                ) : null}
              </View>

              {showAddItem && isAddingHere ? (
                <View style={styles.editorRow}>
                  <InlineChipEditor
                    placeholder={t('meals.library.itemNameInlinePlaceholder')}
                    onSave={name => saveNewItem(group.categoryId, name)}
                    onCancel={() => setAddingCategoryId(null)}
                    layout="full"
                  />
                </View>
              ) : null}
            </View>
          );
        })}

        {categoryGroups.length === 0 ? (
          <Text style={styles.empty}>{t('meals.library.itemsEmpty')}</Text>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.xxs },
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
    marginBottom: spacing.sm,
  },
  groups: {
    gap: spacing.md,
  },
  group: {
    gap: spacing.xs,
  },
  groupTitle: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
