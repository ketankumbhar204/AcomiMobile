import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { FoodCategoryResponse, FoodItemResponse, MealType, UUID } from '../../api/types';
import { FoodItemMultiPicker } from '../../components/meals/FoodItemMultiPicker';
import { PlanningSelectionSection } from '../../components/meals/PlanningSelectionSection';
import { Button, PermissionDeniedScreen } from '../../components/ui';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import {
  appendComboToMenu,
  loadMenuDraft,
  syncItemsOnMenu,
} from '../../utils/dailyMenuDraft';
import { mealTypeLabelKey } from '../../utils/mealLabels';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type DailyMenuSelectItemsScreenProps = {
  spaceId: UUID;
  menuDate: string;
  mealType: MealType;
};

export function DailyMenuSelectItemsScreen({
  spaceId,
  menuDate,
  mealType,
}: DailyMenuSelectItemsScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const permissions = useSpacePermissions(spaceId);
  const showToast = useToastStore(state => state.showToast);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [foodItems, setFoodItems] = useState<FoodItemResponse[]>([]);
  const [categories, setCategories] = useState<FoodCategoryResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comboModalOpen, setComboModalOpen] = useState(false);
  const [comboName, setComboName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemList, categoryList, draft] = await Promise.all([
        mealsApi.getFoodItems(spaceId),
        mealsApi.getFoodCategories(spaceId),
        loadMenuDraft(spaceId, menuDate, mealType),
      ]);
      setFoodItems(itemList.filter(item => item.isActive));
      setCategories(categoryList.filter(category => category.isActive));
      const existingItemIds = draft.options
        .filter(option => option.entryType === 'ITEM' && option.itemId)
        .map(option => option.itemId as string);
      setSelectedIds(existingItemIds);
    } catch {
      showToast(t('meals.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [mealType, menuDate, showToast, spaceId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map(id => foodItems.find(item => item.itemId === id))
        .filter((item): item is FoodItemResponse => item != null),
    [foodItems, selectedIds],
  );

  const removeItem = (itemId: string) => {
    setSelectedIds(prev => prev.filter(id => id !== itemId));
  };

  const saveItems = async () => {
    setSaving(true);
    try {
      await syncItemsOnMenu(
        spaceId,
        menuDate,
        mealType,
        selectedItems.map(item => ({ itemId: item.itemId, name: item.name })),
      );
      showToast(
        selectedItems.length > 0
          ? t('meals.planning.itemsAdded')
          : t('meals.planning.itemsCleared'),
      );
      navigation.goBack();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const openSaveAsCombo = () => {
    if (selectedItems.length === 0) {
      showToast(t('meals.errors.optionsRequired'));
      return;
    }
    setComboName('');
    setComboModalOpen(true);
  };

  const confirmSaveAsCombo = async () => {
    const name = comboName.trim();
    if (!name) {
      showToast(t('meals.planning.comboNameRequired'));
      return;
    }
    if (selectedItems.length === 0) {
      showToast(t('meals.errors.optionsRequired'));
      return;
    }
    setSaving(true);
    try {
      const created = await mealsApi.createMealCombo(spaceId, {
        name,
        description: null,
        itemIds: selectedItems.map(item => item.itemId),
      });
      await syncItemsOnMenu(
        spaceId,
        menuDate,
        mealType,
        selectedItems.map(item => ({ itemId: item.itemId, name: item.name })),
      );
      await appendComboToMenu(spaceId, menuDate, mealType, created);
      showToast(t('meals.planning.comboSavedAndAdded', { name }));
      setComboModalOpen(false);
      navigation.goBack();
    } catch {
      showToast(t('meals.errors.saveComboFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (!permissions.canManageMeals) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>{t(mealTypeLabelKey(mealType))}</Text>
        <Text style={styles.title}>{t('meals.planning.selectItems')}</Text>
        <Text style={styles.subtitle}>{t('meals.planning.selectItemsHint')}</Text>

        {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        <PlanningSelectionSection
          title={t('meals.planning.selectedItems')}
          countLabel={t('meals.planning.selectedCount', { count: selectedItems.length })}
          chips={selectedItems.map(item => ({
            id: item.itemId,
            label: item.name,
            variant: 'ITEM',
          }))}
          onRemove={removeItem}
          emptyText={t('meals.planning.noItemsSelected')}
        />

        <FoodItemMultiPicker
          items={foodItems}
          categories={categories}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          variant="planning"
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t('common.save')}
          loading={saving}
          onPress={() => void saveItems()}
          style={styles.footerButton}
        />
        <Button
          label={t('meals.planning.saveAsCombo')}
          variant="secondary"
          loading={saving}
          onPress={openSaveAsCombo}
          style={styles.footerButton}
        />
      </View>

      <Modal visible={comboModalOpen} transparent animationType="fade" onRequestClose={() => setComboModalOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalBackdropPress} onPress={() => setComboModalOpen(false)}>
            <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
              <Text style={styles.modalTitle}>{t('meals.planning.saveAsComboTitle')}</Text>
              <Text style={styles.modalHint}>{t('meals.planning.saveAsComboHint')}</Text>
              <TextInput
                style={styles.modalInput}
                value={comboName}
                onChangeText={setComboName}
                placeholder={t('meals.planning.comboNamePlaceholder')}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => void confirmSaveAsCombo()}
              />
              <View style={styles.modalActions}>
                <Button label={t('common.cancel')} variant="ghost" onPress={() => setComboModalOpen(false)} />
                <Button label={t('common.save')} loading={saving} onPress={() => void confirmSaveAsCombo()} />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.xxl, paddingBottom: spacing.md },
  eyebrow: { ...typography.caption, color: colors.muted, fontWeight: '600', marginBottom: spacing.xxs },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  loader: { marginVertical: spacing.lg },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  footerButton: { width: '100%' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
  },
  modalBackdropPress: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderRadius: radius.button,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalTitle: { ...typography.h3 },
  modalHint: { ...typography.body, color: colors.muted },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    ...typography.body,
  },
  modalActions: { gap: spacing.sm },
});
