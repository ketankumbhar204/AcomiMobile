import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FoodCategoryResponse } from '../../../api/types';
import { spacing, typography } from '../../../theme';
import { InlineChipEditor } from './InlineChipEditor';
import { MenuChip } from './MenuChip';
import { ScrollableChipRail } from './ScrollableChipRail';

type CategoryChipRailProps = {
  categories: FoodCategoryResponse[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string) => void;
  canManage?: boolean;
  isAdding?: boolean;
  addDisabled?: boolean;
  onStartAdd?: () => void;
  onCancelAdd?: () => void;
  onSaveCategory?: (name: string) => void | Promise<void>;
  onRemoveCategory?: (category: FoodCategoryResponse) => void;
};

export function CategoryChipRail({
  categories,
  selectedCategoryId,
  onSelect,
  canManage = false,
  isAdding = false,
  addDisabled = false,
  onStartAdd,
  onCancelAdd,
  onSaveCategory,
  onRemoveCategory,
}: CategoryChipRailProps) {
  const { t } = useTranslation();
  const activeCategories = categories
    .filter(category => category.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const openCategoryActions = (category: FoodCategoryResponse) => {
    if (!canManage || !onRemoveCategory) {
      return;
    }
    onRemoveCategory(category);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollableChipRail>
        {activeCategories.map(category => (
          <MenuChip
            key={category.categoryId}
            label={category.name}
            variant="filter"
            selected={selectedCategoryId === category.categoryId}
            onPress={() => onSelect(category.categoryId)}
            onLongPress={() => openCategoryActions(category)}
          />
        ))}
        {canManage && !isAdding && onStartAdd ? (
          <MenuChip
            label={t('meals.library.chipAddCategory')}
            variant="add"
            onPress={addDisabled ? undefined : onStartAdd}
            style={addDisabled ? styles.disabled : undefined}
          />
        ) : null}
      </ScrollableChipRail>

      {canManage && isAdding && onSaveCategory && onCancelAdd ? (
        <View style={styles.editorRow}>
          <InlineChipEditor
            placeholder={t('meals.library.categoryNameInlinePlaceholder')}
            onSave={onSaveCategory}
            onCancel={onCancelAdd}
            layout="full"
          />
        </View>
      ) : null}

      {canManage ? (
        <Text style={styles.hint}>{t('meals.library.categoryManageHint')}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  editorRow: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  hint: {
    ...typography.caption,
    color: '#6B7280',
  },
});
