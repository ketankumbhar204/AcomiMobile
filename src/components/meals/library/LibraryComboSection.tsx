import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react-native';
import type { MealComboResponse } from '../../../api/types';
import { EntityPhoto } from '../../files/EntityPhoto';
import { FoodTypeIcon } from '../../ui/FoodTypeIcon';
import type { HeaderOverflowMenuItem } from '../../ui/HeaderOverflowMenu';
import { ListSearchBar } from '../../ui/ListSearchBar';
import { colors, spacing, typography } from '../../../theme';
import { formatComboPrice } from '../../../utils/comboPrice';
import { formatComboIncludesCompact } from '../../../utils/comboIncludes';
import { LibraryCatalogRow } from './LibraryCatalogRow';
import { LibrarySectionHeader } from './LibrarySectionHeader';

type LibraryComboSectionProps = {
  combos: MealComboResponse[];
  selectedComboId: string | null;
  canManage: boolean;
  spaceId: string;
  canEditPhoto: boolean;
  onSelect: (comboId: string) => void;
  onAdd?: () => void;
  onEdit?: (combo: MealComboResponse) => void;
  onToggle?: (combo: MealComboResponse) => void;
  onRemove?: (combo: MealComboResponse) => void;
  onPhotoChanged: () => void;
  showSearch?: boolean;
};

export function LibraryComboSection({
  combos,
  selectedComboId,
  canManage,
  spaceId,
  canEditPhoto,
  onSelect,
  onAdd,
  onEdit,
  onToggle,
  onRemove,
  onPhotoChanged,
  showSearch = true,
}: LibraryComboSectionProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const activeCombos = useMemo(() => {
    const sorted = combos
      .filter(combo => combo.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return sorted;
    }
    return sorted.filter(combo => {
      const includes = formatComboIncludesCompact(
        (combo.items ?? []).map(item => ({ name: item.name, quantity: item.quantity })),
      );
      return (
        combo.name.toLowerCase().includes(query) ||
        includes.toLowerCase().includes(query) ||
        (combo.description ?? '').toLowerCase().includes(query)
      );
    });
  }, [combos, searchQuery]);

  return (
    <View style={styles.wrap}>
      {showSearch ? (
        <ListSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('meals.library.searchCombos')}
        />
      ) : null}

      <LibrarySectionHeader
        title={t('meals.library.allCombos', { count: activeCombos.length })}
        actionLabel={canManage ? t('meals.library.addComboAction') : undefined}
        onAction={canManage ? onAdd : undefined}
        actionVariant="pill"
        actionTestID="library-add-combo"
      />

      {activeCombos.length === 0 ? (
        <Text style={styles.empty}>
          {searchQuery.trim() ? t('list.emptyFiltered') : t('meals.library.combosEmpty')}
        </Text>
      ) : (
        <View style={styles.list}>
          {activeCombos.map(combo => {
            const includes = formatComboIncludesCompact(
              (combo.items ?? []).map(item => ({ name: item.name, quantity: item.quantity })),
            );
            const menuItems: HeaderOverflowMenuItem[] = [];
            if (canManage && onEdit) {
              menuItems.push({
                id: 'edit',
                label: t('meals.library.editCombo'),
                icon: Pencil,
                onPress: () => onEdit(combo),
              });
            }
            if (canManage && onToggle) {
              const hidden = combo.enabledForSpace === false;
              menuItems.push({
                id: 'toggle',
                label: hidden
                  ? t('meals.library.showComboInSpace')
                  : t('meals.library.hideComboInSpace'),
                icon: hidden ? Eye : EyeOff,
                onPress: () => onToggle(combo),
              });
            }
            if (canManage && onRemove) {
              menuItems.push({
                id: 'remove',
                label: t('meals.library.removeCombo'),
                icon: Trash2,
                destructive: true,
                onPress: () => onRemove(combo),
              });
            }

            return (
              <LibraryCatalogRow
                key={combo.comboId}
                testID={`library-combo-${combo.comboId}`}
                title={combo.name}
                subtitle={includes || t('meals.library.comboPreviewEmpty')}
                detail={combo.description?.trim() || undefined}
                status={
                  combo.enabledForSpace === false
                    ? t('meals.library.comboHiddenInSpace')
                    : undefined
                }
                meta={formatComboPrice(combo.price, combo.currencyCode)}
                foodType={combo.foodType ?? 'VEG'}
                selected={selectedComboId === combo.comboId}
                leading={
                  <EntityPhoto
                    spaceId={spaceId}
                    entityId={combo.comboId}
                    kind="combo"
                    fileId={combo.photoFileId}
                    canEdit={canEditPhoto}
                    size={28}
                    title={combo.name}
                    onChanged={onPhotoChanged}
                    fallback={<FoodTypeIcon foodType={combo.foodType ?? 'VEG'} size={14} />}
                  />
                }
                onPress={() => {
                  if (canManage && selectedComboId === combo.comboId && onEdit) {
                    onEdit(combo);
                    return;
                  }
                  onSelect(combo.comboId);
                }}
                menuItems={menuItems}
                menuAccessibilityLabel={t('meals.library.comboActions', { name: combo.name })}
              />
            );
          })}
        </View>
      )}
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
  },
});
