import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FoodCategoryResponse } from '../../api/types';
import {
  FilterCheckboxRow,
  FilterDrawerSection,
  ListFilterDrawer,
} from '../ui';
import { toggleSetValue } from '../../utils/filterCount';

type MenuLibraryFilterDrawerProps = {
  visible: boolean;
  categories: FoodCategoryResponse[];
  applied: Set<string>;
  onClose: () => void;
  onApply: (categoryIds: Set<string>) => void;
};

export function MenuLibraryFilterDrawer({
  visible,
  categories,
  applied,
  onClose,
  onApply,
}: MenuLibraryFilterDrawerProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Set<string>>(applied);

  useEffect(() => {
    if (visible) {
      setDraft(new Set(applied));
    }
  }, [applied, visible]);

  return (
    <ListFilterDrawer
      visible={visible}
      onClose={onClose}
      onReset={() => setDraft(new Set())}
      onApply={() => {
        onApply(new Set(draft));
        onClose();
      }}>
      <FilterDrawerSection title={t('list.filters.category')}>
        {categories.map(category => (
          <FilterCheckboxRow
            key={category.categoryId}
            label={category.name}
            checked={draft.has(category.categoryId)}
            onToggle={() => setDraft(prev => toggleSetValue(prev, category.categoryId))}
          />
        ))}
      </FilterDrawerSection>
    </ListFilterDrawer>
  );
}
