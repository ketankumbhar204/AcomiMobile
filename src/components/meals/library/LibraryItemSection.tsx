import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react-native';
import type { FoodCategoryResponse, FoodItemResponse, FoodType } from '../../../api/types';
import { EntityPhoto } from '../../files/EntityPhoto';
import { FoodTypeIcon } from '../../ui/FoodTypeIcon';
import type { HeaderOverflowMenuItem } from '../../ui/HeaderOverflowMenu';
import { ListSearchBar } from '../../ui/ListSearchBar';
import { colors, spacing, typography } from '../../../theme';
import { formatComboPrice } from '../../../utils/comboPrice';
import { CategoryChipRail } from './CategoryChipRail';
import { LibraryCatalogRow } from './LibraryCatalogRow';
import { LibraryItemEditor } from './LibraryItemEditor';
import { LibrarySectionHeader } from './LibrarySectionHeader';

type LibraryItemSectionProps = {
  items: FoodItemResponse[];
  categories: FoodCategoryResponse[];
  selectedCategoryId: string | null;
  totalItemCount: number;
  countByCategoryId: Record<string, number>;
  canManage: boolean;
  spaceId: string;
  canEditPhoto: boolean;
  isAdding: boolean;
  editingItemId: string | null;
  addDisabled: boolean;
  showCategoryTools: boolean;
  showAddItem: boolean;
  includeAll: boolean;
  removeLabel: string;
  emptyLabel: string;
  formatTitle: (count: number) => string;
  onSelectCategory: (categoryId: string) => void;
  onSelectAll?: () => void;
  onManageCategories?: () => void;
  onStartAdd?: () => void;
  onCancelAdd: () => void;
  onSaveItem: (name: string, foodType: FoodType, categoryId: string) => void | Promise<void>;
  onStartEdit: (item: FoodItemResponse) => void;
  onCancelEdit: () => void;
  onUpdateItem: (itemId: string, name: string, foodType: FoodType) => void | Promise<void>;
  onRemoveItem?: (item: FoodItemResponse) => void;
  onRemoveCategory?: (category: FoodCategoryResponse) => void;
  onPhotoChanged: () => void;
  addCategoryId: string | null;
  isAddingCategory?: boolean;
  onSaveCategory?: (name: string) => void | Promise<void>;
  onCancelCategory?: () => void;
  showSearch?: boolean;
};

export function LibraryItemSection({
  items,
  categories,
  selectedCategoryId,
  totalItemCount,
  countByCategoryId,
  canManage,
  spaceId,
  canEditPhoto,
  isAdding,
  editingItemId,
  addDisabled,
  showCategoryTools,
  showAddItem,
  includeAll,
  removeLabel,
  emptyLabel,
  formatTitle,
  onSelectCategory,
  onSelectAll,
  onManageCategories,
  onStartAdd,
  onCancelAdd,
  onSaveItem,
  onStartEdit,
  onCancelEdit,
  onUpdateItem,
  onRemoveItem,
  onRemoveCategory,
  onPhotoChanged,
  addCategoryId,
  isAddingCategory = false,
  onSaveCategory,
  onCancelCategory,
  showSearch = true,
}: LibraryItemSectionProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const activeItems = useMemo(() => {
    const sorted = items
      .filter(item => item.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return sorted;
    }
    return sorted.filter(item => {
      const categoryName = item.categoryName ?? '';
      return (
        item.name.toLowerCase().includes(query) ||
        categoryName.toLowerCase().includes(query)
      );
    });
  }, [items, searchQuery]);

  const editingItem = useMemo(
    () => activeItems.find(item => item.itemId === editingItemId) ?? null,
    [activeItems, editingItemId],
  );

  const categoryNameById = useMemo(() => {
    const names: Record<string, string> = {};
    for (const category of categories) {
      names[category.categoryId] = category.name;
    }
    return names;
  }, [categories]);

  return (
    <View style={styles.wrap}>
      {showCategoryTools ? (
        <LibrarySectionHeader
          title={t('meals.library.categories')}
          actionLabel={canManage ? t('meals.library.manageCategories') : undefined}
          onAction={canManage ? onManageCategories : undefined}
          actionTestID="library-manage-categories"
        />
      ) : null}

      {categories.length > 0 || showCategoryTools ? (
        <CategoryChipRail
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          includeAll={includeAll}
          allCount={includeAll ? totalItemCount : undefined}
          countByCategoryId={countByCategoryId}
          onSelectAll={onSelectAll}
          onSelect={onSelectCategory}
          canManage={showCategoryTools && canManage}
          showRemoveHint={false}
          isAdding={isAddingCategory}
          onSaveCategory={onSaveCategory}
          onCancelAdd={onCancelCategory}
          onRemoveCategory={showCategoryTools && canManage ? onRemoveCategory : undefined}
        />
      ) : null}

      {showSearch ? (
        <ListSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('meals.library.searchItems')}
        />
      ) : null}

      <LibrarySectionHeader
        title={formatTitle(activeItems.length)}
        actionLabel={showAddItem && canManage ? t('meals.library.addItemAction') : undefined}
        onAction={showAddItem && canManage && !addDisabled ? onStartAdd : undefined}
        actionVariant="pill"
        actionTestID="library-add-item"
      />

      {isAdding && canManage ? (
        <LibraryItemEditor
          categories={categories}
          categoryId={addCategoryId}
          showCategoryPicker={selectedCategoryId == null}
          onSave={onSaveItem}
          onCancel={onCancelAdd}
        />
      ) : null}

      {activeItems.length === 0 && !isAdding ? (
        <Text style={styles.empty}>
          {searchQuery.trim() ? t('list.emptyFiltered') : emptyLabel}
        </Text>
      ) : null}

      <View style={styles.list}>
        {activeItems.map(item => {
          if (editingItem && editingItem.itemId === item.itemId) {
            return (
              <LibraryItemEditor
                key={item.itemId}
                initialName={item.name}
                initialFoodType={item.foodType ?? 'VEG'}
                categoryId={item.categoryId}
                onSave={(name, foodType) => onUpdateItem(item.itemId, name, foodType)}
                onCancel={onCancelEdit}
              />
            );
          }

          const menuItems: HeaderOverflowMenuItem[] = [];
          if (canManage && item.isCustom) {
            menuItems.push({
              id: 'edit',
              label: t('meals.library.editItem'),
              icon: Pencil,
              onPress: () => onStartEdit(item),
            });
          }
          if (canManage && onRemoveItem) {
            menuItems.push({
              id: 'remove',
              label: removeLabel,
              icon: Trash2,
              destructive: true,
              onPress: () => onRemoveItem(item),
            });
          }

          const categoryName = item.categoryName || categoryNameById[item.categoryId];
          const subtitleParts = [categoryName, item.isCustom ? t('meals.library.custom') : null].filter(
            Boolean,
          );

          return (
            <LibraryCatalogRow
              key={item.itemId}
              testID={`library-item-${item.itemId}`}
              title={item.name}
              subtitle={subtitleParts.join(' · ')}
              meta={formatComboPrice(item.defaultPrice, item.currencyCode)}
              foodType={item.foodType ?? 'VEG'}
              leading={
                <EntityPhoto
                  spaceId={spaceId}
                  entityId={item.itemId}
                  kind="menuItem"
                  fileId={item.photoFileId}
                  canEdit={canEditPhoto}
                  size={28}
                  title={item.name}
                  onChanged={onPhotoChanged}
                  fallback={<FoodTypeIcon foodType={item.foodType ?? 'VEG'} size={14} />}
                />
              }
              openMenuOnPress
              menuItems={menuItems}
              menuAccessibilityLabel={t('meals.library.itemActions', { name: item.name })}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
});
