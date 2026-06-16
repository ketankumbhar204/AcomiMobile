import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { FoodCategoryResponse, FoodItemResponse, UUID } from '../../api/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { MenuDraftOption } from '../../utils/dailyMenuDraft';
import { FoodItemMultiPicker } from './FoodItemMultiPicker';
import { MenuPlanningBottomSheet, SheetPrimaryButton } from './MenuPlanningBottomSheet';
import { PlanningSelectionSection } from './PlanningSelectionSection';

type CreateComboSheetProps = {
  visible: boolean;
  spaceId: UUID;
  existingOptions: MenuDraftOption[];
  onClose: () => void;
  onBack?: () => void;
  onSave: (name: string, itemIds: string[], saveToLibrary: boolean) => Promise<void>;
};

function nextComboName(existing: MenuDraftOption[]): string {
  const usedNumbers = new Set<number>();
  for (const opt of existing) {
    const comboMatch = /^Combo (\d+)$/i.exec(opt.label);
    const legacyPackageMatch = /^Package (\d+)$/i.exec(opt.label);
    if (comboMatch) usedNumbers.add(parseInt(comboMatch[1], 10));
    if (legacyPackageMatch) usedNumbers.add(parseInt(legacyPackageMatch[1], 10));
  }
  let n = 1;
  while (usedNumbers.has(n)) n++;
  return `Combo ${n}`;
}

export function CreateComboSheet({
  visible,
  spaceId,
  existingOptions,
  onClose,
  onBack,
  onSave,
}: CreateComboSheetProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [foodItems, setFoodItems] = useState<FoodItemResponse[]>([]);
  const [categories, setCategories] = useState<FoodCategoryResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comboName, setComboName] = useState('');
  const [saveToLibrary, setSaveToLibrary] = useState(false);

  const defaultName = useMemo(
    () => nextComboName(existingOptions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible],
  );

  useEffect(() => {
    if (!visible) return;
    setComboName(defaultName);
    setSelectedIds([]);
    setSaveToLibrary(false);
  }, [visible, defaultName]);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setLoading(true);
    Promise.all([mealsApi.getFoodItems(spaceId), mealsApi.getFoodCategories(spaceId)])
      .then(([items, cats]) => {
        if (!active) return;
        setFoodItems(items.filter(i => i.isActive));
        setCategories(cats.filter(c => c.isActive));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible, spaceId]);

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map(id => foodItems.find(item => item.itemId === id))
        .filter((item): item is FoodItemResponse => item != null),
    [selectedIds, foodItems],
  );

  const addItemInline = useCallback(
    async (categoryId: string, itemName: string) => {
      try {
        const created = await mealsApi.createFoodItem(spaceId, { categoryId, name: itemName });
        setFoodItems(current => [...current, created]);
        showToast(t('meals.library.itemCreateSuccess'));
        return created;
      } catch {
        showToast(t('meals.errors.actionFailed'));
        throw new Error('createFoodItem failed');
      }
    },
    [showToast, spaceId, t],
  );

  const addCategoryInline = useCallback(
    async (name: string) => {
      try {
        const created = await mealsApi.createFoodCategory(spaceId, { name });
        setCategories(current => [...current, created]);
        showToast(t('meals.library.categoryCreateSuccess'));
        return created;
      } catch {
        showToast(t('meals.errors.actionFailed'));
        throw new Error('createFoodCategory failed');
      }
    },
    [showToast, spaceId, t],
  );

  const handleSave = async () => {
    if (selectedItems.length === 0) return;
    const name = comboName.trim() || defaultName;
    setSaving(true);
    try {
      await onSave(
        name,
        selectedItems.map(i => i.itemId),
        saveToLibrary,
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <MenuPlanningBottomSheet
      visible={visible}
      title={t('meals.planning.createComboTitle')}
      onClose={onClose}
      onBack={onBack}
      footer={
        <SheetPrimaryButton
          label={saving ? t('common.saving') : t('meals.planning.addComboToMeal')}
          onPress={() => void handleSave()}
          disabled={selectedItems.length === 0}
          loading={saving}
        />
      }>
      <Text style={styles.fieldLabel}>{t('meals.planning.comboNameLabel')}</Text>
      <TextInput
        style={styles.nameInput}
        value={comboName}
        onChangeText={setComboName}
        placeholder={defaultName}
        returnKeyType="done"
      />

      <PlanningSelectionSection
        title={t('meals.planning.comboItemsLabel')}
        countLabel={
          selectedItems.length > 0
            ? t('meals.planning.selectedCount', { count: selectedItems.length })
            : undefined
        }
        chips={selectedItems.map(item => ({
          id: item.itemId,
          label: item.name,
          variant: 'ITEM',
        }))}
        onRemove={id => setSelectedIds(prev => prev.filter(x => x !== id))}
        emptyText={t('meals.planning.noItemsSelected')}
      />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FoodItemMultiPicker
          items={foodItems}
          categories={categories}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          variant="planning"
          canAddItem
          canAddCategory
          onAddItem={addItemInline}
          onAddCategory={addCategoryInline}
        />
      )}

      <View style={styles.toggleRow}>
        <View style={styles.toggleText}>
          <Text style={styles.toggleLabel}>{t('meals.planning.saveToLibraryLabel')}</Text>
          <Text style={styles.toggleHint}>{t('meals.planning.saveToLibraryHint')}</Text>
        </View>
        <Switch
          value={saveToLibrary}
          onValueChange={setSaveToLibrary}
          trackColor={{ true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>
    </MenuPlanningBottomSheet>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    backgroundColor: colors.surface,
    ...typography.body,
    marginBottom: spacing.xs,
  },
  loader: { marginVertical: spacing.lg },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  toggleText: { flex: 1 },
  toggleLabel: { ...typography.bodyStrong },
  toggleHint: { ...typography.caption, color: colors.muted, marginTop: spacing.xxs },
});
