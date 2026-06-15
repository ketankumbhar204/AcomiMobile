import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FoodItemResponse } from '../../../api/types';
import { colors, spacing, typography } from '../../../theme';
import { InlineChipEditor } from './InlineChipEditor';
import { MenuChip } from './MenuChip';

const DEFAULT_VISIBLE = 32;

type ItemChipGridProps = {
  items: FoodItemResponse[];
  categoryName?: string;
  canManage?: boolean;
  isAdding?: boolean;
  editingItemId?: string | null;
  addDisabled?: boolean;
  onStartAdd?: () => void;
  onCancelAdd?: () => void;
  onSaveItem?: (name: string) => void | Promise<void>;
  onStartEdit?: (item: FoodItemResponse) => void;
  onCancelEdit?: () => void;
  onUpdateItem?: (itemId: string, name: string) => void | Promise<void>;
  onRemoveItem?: (item: FoodItemResponse) => void;
  onRemoveCategory?: () => void;
};

export function ItemChipGrid({
  items,
  categoryName,
  canManage = false,
  isAdding = false,
  editingItemId = null,
  addDisabled = false,
  onStartAdd,
  onCancelAdd,
  onSaveItem,
  onStartEdit,
  onCancelEdit,
  onUpdateItem,
  onRemoveItem,
  onRemoveCategory,
}: ItemChipGridProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const activeItems = useMemo(
    () => items.filter(item => item.isActive).sort((a, b) => a.name.localeCompare(b.name)),
    [items],
  );

  const visibleItems = expanded ? activeItems : activeItems.slice(0, DEFAULT_VISIBLE);
  const hasMore = activeItems.length > DEFAULT_VISIBLE;

  const editingItem = useMemo(
    () => activeItems.find(item => item.itemId === editingItemId) ?? null,
    [activeItems, editingItemId],
  );

  const openItemActions = (item: FoodItemResponse) => {
    if (!canManage) {
      return;
    }

    const scopeLabel = item.isCustom
      ? t('meals.library.custom')
      : t('meals.library.globalCatalog');

    const buttons: Array<{ text: string; style?: 'destructive' | 'cancel'; onPress?: () => void }> =
      [];

    if (item.isCustom && onStartEdit) {
      buttons.push({
        text: t('meals.library.editItem'),
        onPress: () => onStartEdit(item),
      });
    }

    if (onRemoveItem) {
      buttons.push({
        text: t('meals.library.removeItem'),
        style: 'destructive',
        onPress: () => onRemoveItem(item),
      });
    }

    buttons.push({ text: t('common.cancel'), style: 'cancel' });

    Alert.alert(item.name, scopeLabel, buttons);
  };

  const title = categoryName
    ? t('meals.library.categoryItemsTitle', { category: categoryName, count: activeItems.length })
    : t('meals.library.items');

  const showInlineEditor =
    (isAdding && onSaveItem && onCancelAdd) ||
    (editingItem && onUpdateItem && onCancelEdit);

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>{title}</Text>
        {canManage && onRemoveCategory ? (
          <Pressable
            onPress={onRemoveCategory}
            style={({ pressed }) => [styles.removeButton, pressed && styles.removePressed]}
            hitSlop={8}>
            <Text style={styles.removeLabel}>{t('meals.library.removeCategory')}</Text>
          </Pressable>
        ) : null}
      </View>
      {canManage ? (
        <Text style={styles.hint}>{t('meals.library.itemManageHint')}</Text>
      ) : null}

      {activeItems.length === 0 && !isAdding ? (
        <Text style={styles.empty}>{t('meals.library.itemsEmptyCategory')}</Text>
      ) : (
        <View style={styles.grid}>
          {visibleItems.map(item => {
            if (editingItemId === item.itemId) {
              return null;
            }

            return (
              <MenuChip
                key={item.itemId}
                label={item.name}
                variant="item"
                size="compact"
                isCustom={item.isCustom}
                onPress={canManage ? () => openItemActions(item) : undefined}
                onLongPress={canManage ? () => openItemActions(item) : undefined}
              />
            );
          })}
          {canManage && !isAdding && !editingItemId && onStartAdd ? (
            <MenuChip
              label={t('meals.library.chipAddItem')}
              variant="add"
              size="compact"
              onPress={addDisabled ? undefined : onStartAdd}
              style={addDisabled ? styles.disabled : undefined}
            />
          ) : null}
        </View>
      )}

      {canManage && activeItems.length === 0 && !isAdding && onStartAdd ? (
        <MenuChip
          label={t('meals.library.chipAddItem')}
          variant="add"
          size="compact"
          onPress={addDisabled ? undefined : onStartAdd}
          style={[styles.emptyAdd, addDisabled ? styles.disabled : undefined]}
        />
      ) : null}

      {showInlineEditor ? (
        <View style={styles.editorRow}>
          {isAdding && onSaveItem && onCancelAdd ? (
            <InlineChipEditor
              placeholder={t('meals.library.itemNameInlinePlaceholder')}
              onSave={onSaveItem}
              onCancel={onCancelAdd}
              layout="full"
            />
          ) : null}
          {editingItem && onUpdateItem && onCancelEdit ? (
            <InlineChipEditor
              initialValue={editingItem.name}
              placeholder={t('meals.library.itemNameInlinePlaceholder')}
              onSave={name => onUpdateItem(editingItem.itemId, name)}
              onCancel={onCancelEdit}
              layout="full"
            />
          ) : null}
        </View>
      ) : null}

      {hasMore && !expanded ? (
        <Text style={styles.showAll} onPress={() => setExpanded(true)}>
          {t('meals.library.showAllItems', { count: activeItems.length })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xxs,
  },
  sectionLabel: {
    ...typography.bodyStrong,
    flex: 1,
  },
  removeButton: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  removePressed: {
    opacity: 0.7,
  },
  removeLabel: {
    ...typography.caption,
    color: '#DC2626',
    fontWeight: '700',
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  editorRow: {
    width: '100%',
    marginTop: spacing.sm,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  emptyAdd: {
    alignSelf: 'flex-start',
  },
  disabled: {
    opacity: 0.45,
  },
  showAll: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
});
