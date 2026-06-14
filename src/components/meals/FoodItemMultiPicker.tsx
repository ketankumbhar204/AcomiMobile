import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FoodItemResponse } from '../../api/types';
import { MenuChip } from './library/MenuChip';
import { colors, radius, spacing, typography } from '../../theme';

type FoodItemMultiPickerProps = {
  items: FoodItemResponse[];
  selectedIds: string[];
  onChange: (itemIds: string[]) => void;
  error?: string | null;
};

type CategoryGroup = {
  categoryId: string;
  categoryName: string;
  items: FoodItemResponse[];
};

function buildCategoryGroups(items: FoodItemResponse[], fallbackCategory: string): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();

  for (const item of items) {
    const categoryId = item.categoryId;
    const categoryName = item.categoryName?.trim() || fallbackCategory;
    const existing = map.get(categoryId);

    if (existing) {
      existing.items.push(item);
      continue;
    }

    map.set(categoryId, {
      categoryId,
      categoryName,
      items: [item],
    });
  }

  return Array.from(map.values())
    .map(group => ({
      ...group,
      items: group.items.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
}

export function FoodItemMultiPicker({
  items,
  selectedIds,
  onChange,
  error,
}: FoodItemMultiPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

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

  const categoryGroups = useMemo(
    () => buildCategoryGroups(filteredItems, t('meals.library.uncategorized')),
    [filteredItems, t],
  );

  function toggleItem(itemId: string) {
    if (selectedIds.includes(itemId)) {
      onChange(selectedIds.filter(id => id !== itemId));
      return;
    }
    onChange([...selectedIds, itemId]);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('meals.library.comboItemsLabel')}</Text>
      <Text style={styles.hint}>{t('meals.library.comboItemsHint')}</Text>

      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder={t('meals.library.searchItems')}
        placeholderTextColor={colors.muted}
      />

      {selectedIds.length > 0 ? (
        <Text style={styles.count}>{t('meals.library.selectedCount', { count: selectedIds.length })}</Text>
      ) : null}

      <View style={styles.groups}>
        {categoryGroups.map(group => {
          const selectedInGroup = group.items.filter(item => selectedIds.includes(item.itemId)).length;

          return (
            <View key={group.categoryId} style={styles.group}>
              <Text style={styles.groupTitle}>
                {selectedInGroup > 0
                  ? t('meals.library.comboCategorySelected', {
                      category: group.categoryName,
                      selected: selectedInGroup,
                      total: group.items.length,
                    })
                  : t('meals.library.comboCategoryTitle', {
                      category: group.categoryName,
                      total: group.items.length,
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
              </View>
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
  wrapper: { marginBottom: spacing.lg },
  label: { ...typography.label, marginBottom: spacing.xxs },
  hint: { ...typography.caption, color: colors.muted, marginBottom: spacing.sm },
  search: {
    ...typography.body,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  count: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '600',
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
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  error: { ...typography.caption, color: '#DC2626', marginTop: spacing.xs },
});
