import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FoodCategoryResponse, FoodType } from '../../../api/types';
import { FoodTypePicker } from '../../ui/FoodTypePicker';
import { colors, spacing, typography } from '../../../theme';
import { InlineChipEditor } from './InlineChipEditor';
import { MenuChip } from './MenuChip';
import { ScrollableChipRail } from './ScrollableChipRail';

type LibraryItemEditorProps = {
  initialName?: string;
  initialFoodType?: FoodType;
  categories?: FoodCategoryResponse[];
  categoryId: string | null;
  showCategoryPicker?: boolean;
  onSave: (name: string, foodType: FoodType, categoryId: string) => void | Promise<void>;
  onCancel: () => void;
};

export function LibraryItemEditor({
  initialName = '',
  initialFoodType = 'VEG',
  categories = [],
  categoryId,
  showCategoryPicker = false,
  onSave,
  onCancel,
}: LibraryItemEditorProps) {
  const { t } = useTranslation();
  const [foodType, setFoodType] = useState<FoodType>(initialFoodType);
  const [draftCategoryId, setDraftCategoryId] = useState<string | null>(categoryId);

  return (
    <View style={styles.wrap}>
      {showCategoryPicker ? (
        <>
          <Text style={styles.hint}>{t('meals.library.filterDrawer.pickCategoryToAdd')}</Text>
          <ScrollableChipRail>
            {categories.map(category => (
              <MenuChip
                key={category.categoryId}
                label={category.name}
                variant="filter"
                selected={draftCategoryId === category.categoryId}
                onPress={() => setDraftCategoryId(category.categoryId)}
              />
            ))}
          </ScrollableChipRail>
        </>
      ) : null}
      <InlineChipEditor
        initialValue={initialName}
        placeholder={t('meals.library.itemNameInlinePlaceholder')}
        onSave={name => {
          const targetCategoryId = showCategoryPicker ? draftCategoryId : categoryId;
          if (!targetCategoryId) {
            return;
          }
          return onSave(name, foodType, targetCategoryId);
        }}
        onCancel={onCancel}
        layout="full"
      />
      <FoodTypePicker value={foodType} onChange={setFoodType} compact />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
  },
});
