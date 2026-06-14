import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import {
  CompositeNavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { FoodCategoryResponse, FoodItemResponse, MealComboResponse, UUID } from '../../api/types';
import {
  CategoryChipRail,
  CategoryPreviewBar,
  ComboChipRail,
  ComboPreviewBar,
  ItemChipGrid,
} from '../../components/meals';
import { PermissionDeniedScreen } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useMenuLibrary } from '../../hooks/useMenuLibrary';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';

type MenuLibraryScreenProps = {
  spaceId: UUID;
};

type MenuLibraryNav = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Meals'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type InlineEditor = 'category' | 'item-add' | null;

export function MenuLibraryScreen({ spaceId }: MenuLibraryScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<MenuLibraryNav>();
  const permissions = useSpacePermissions(spaceId);
  const showToast = useToastStore(state => state.showToast);

  const {
    loading,
    loadFailed,
    activeCategories,
    activeCombos,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedCategory,
    selectedComboId,
    setSelectedComboId,
    selectedCombo,
    filteredItems,
    stats,
    reload,
  } = useMenuLibrary(spaceId);

  const [inlineEditor, setInlineEditor] = useState<InlineEditor>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const canManage = permissions.canManageMeals === true;
  const inlineBusy = inlineEditor !== null || editingItemId !== null;

  const statsSummary = useMemo(
    () =>
      t('meals.library.statsSummary', {
        categories: stats.categoryCount,
        items: stats.itemCount,
        combos: stats.comboCount,
      }),
    [stats.categoryCount, stats.itemCount, stats.comboCount, t],
  );

  const closeInlineEditors = useCallback(() => {
    setInlineEditor(null);
    setEditingItemId(null);
  }, []);

  const saveCategory = useCallback(
    async (name: string) => {
      try {
        const created = await mealsApi.createFoodCategory(spaceId, { name });
        showToast(t('meals.library.categoryCreateSuccess'));
        closeInlineEditors();
        await reload();
        setSelectedCategoryId(created.categoryId);
      } catch {
        showToast(t('meals.errors.actionFailed'));
      }
    },
    [closeInlineEditors, reload, setSelectedCategoryId, showToast, spaceId, t],
  );

  const saveItem = useCallback(
    async (name: string) => {
      if (!selectedCategoryId) {
        return;
      }
      try {
        await mealsApi.createFoodItem(spaceId, {
          categoryId: selectedCategoryId,
          name,
        });
        showToast(t('meals.library.itemCreateSuccess'));
        closeInlineEditors();
        await reload();
      } catch {
        showToast(t('meals.errors.actionFailed'));
      }
    },
    [closeInlineEditors, reload, selectedCategoryId, showToast, spaceId, t],
  );

  const updateItem = useCallback(
    async (itemId: string, name: string) => {
      try {
        await mealsApi.updateFoodItem(spaceId, itemId, { name });
        showToast(t('meals.library.itemUpdateSuccess'));
        closeInlineEditors();
        await reload();
      } catch {
        showToast(t('meals.errors.actionFailed'));
      }
    },
    [closeInlineEditors, reload, showToast, spaceId, t],
  );

  const removeItem = useCallback(
    (item: FoodItemResponse) => {
      const message = item.isCustom
        ? t('meals.library.deactivateItemConfirmSpace')
        : t('meals.library.deactivateItemConfirm');

      Alert.alert(t('meals.library.removeItem'), message, [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('meals.library.removeItem'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await mealsApi.deactivateFoodItem(spaceId, item.itemId);
                showToast(t('meals.library.itemDeactivateSuccess'));
                await reload();
              } catch {
                showToast(t('meals.errors.actionFailed'));
              }
            })();
          },
        },
      ]);
    },
    [reload, showToast, spaceId, t],
  );

  const removeCategory = useCallback(
    (category: FoodCategoryResponse) => {
      const message =
        category.scope === 'GLOBAL'
          ? t('meals.library.deactivateCategoryConfirmGlobal')
          : t('meals.library.deactivateCategoryConfirmSpace');

      Alert.alert(category.name, message, [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('meals.library.removeCategory'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await mealsApi.deactivateFoodCategory(spaceId, category.categoryId);
                showToast(t('meals.library.categoryDeactivateSuccess'));
                closeInlineEditors();
                await reload();
              } catch {
                showToast(t('meals.errors.actionFailed'));
              }
            })();
          },
        },
      ]);
    },
    [closeInlineEditors, reload, showToast, spaceId, t],
  );

  const removeCombo = useCallback(
    (combo: MealComboResponse) => {
      Alert.alert(t('meals.library.removeCombo'), t('meals.library.deactivateComboConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('meals.library.removeCombo'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await mealsApi.deactivateMealCombo(spaceId, combo.comboId);
                showToast(t('meals.library.comboDeactivateSuccess'));
                await reload();
              } catch {
                showToast(t('meals.errors.actionFailed'));
              }
            })();
          },
        },
      ]);
    },
    [reload, showToast, spaceId, t],
  );

  const openComboForm = useCallback(
    (mode: 'create' | 'edit', comboId?: UUID) => {
      closeInlineEditors();
      navigation.navigate('MealComboForm', {
        spaceId,
        mode,
        comboId: mode === 'edit' ? comboId : undefined,
      });
    },
    [closeInlineEditors, navigation, spaceId],
  );

  if (!permissions.canViewMeals) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  return (
    <Screen scrollable contentStyle={styles.content}>
      <Text style={styles.title}>{t('meals.library.title')}</Text>
      <Text style={styles.subtitle}>{t('meals.library.subtitle')}</Text>

      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {loadFailed ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>{t('meals.library.backendPending')}</Text>
          <Text style={styles.bannerBody}>{t('meals.library.backendPendingHint')}</Text>
        </View>
      ) : null}

      {!loading && !loadFailed && stats.itemCount === 0 ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>{t('meals.library.seedHint')}</Text>
          <Text style={styles.bannerBody}>{t('meals.library.seedHintBody')}</Text>
        </View>
      ) : null}

      {!loading && !loadFailed ? (
        <Text style={styles.statsSummary}>{statsSummary}</Text>
      ) : null}

      {!loading && !loadFailed && activeCategories.length > 0 ? (
        <>
          <CategoryChipRail
            categories={activeCategories}
            selectedCategoryId={selectedCategoryId}
            onSelect={categoryId => {
              closeInlineEditors();
              setSelectedCategoryId(categoryId);
            }}
            canManage={canManage}
            isAdding={inlineEditor === 'category'}
            addDisabled={inlineBusy && inlineEditor !== 'category'}
            onStartAdd={() => {
              closeInlineEditors();
              setInlineEditor('category');
            }}
            onCancelAdd={closeInlineEditors}
            onSaveCategory={saveCategory}
            onRemoveCategory={canManage ? removeCategory : undefined}
          />

          <CategoryPreviewBar
            category={selectedCategory}
            itemCount={filteredItems.filter(item => item.isActive).length}
            canManage={canManage}
            onRemove={
              selectedCategory && canManage
                ? () => removeCategory(selectedCategory)
                : undefined
            }
          />

          <ItemChipGrid
            items={filteredItems}
            categoryName={selectedCategory?.name}
            canManage={canManage}
            isAdding={inlineEditor === 'item-add'}
            editingItemId={editingItemId}
            addDisabled={inlineBusy && inlineEditor !== 'item-add'}
            onStartAdd={() => {
              closeInlineEditors();
              setInlineEditor('item-add');
            }}
            onCancelAdd={closeInlineEditors}
            onSaveItem={saveItem}
            onStartEdit={item => {
              setInlineEditor(null);
              setEditingItemId(item.itemId);
            }}
            onCancelEdit={closeInlineEditors}
            onUpdateItem={updateItem}
            onRemoveItem={canManage ? removeItem : undefined}
          />
        </>
      ) : null}

      {!loading && !loadFailed && activeCategories.length === 0 ? (
        <Text style={styles.empty}>{t('meals.library.categoriesEmpty')}</Text>
      ) : null}

      {!loading && !loadFailed ? (
        <>
          <ComboChipRail
            combos={activeCombos}
            selectedComboId={selectedComboId}
            onSelect={setSelectedComboId}
            canManage={canManage}
            onAddCombo={() => openComboForm('create')}
            onEditCombo={combo => openComboForm('edit', combo.comboId)}
            onRemoveCombo={canManage ? removeCombo : undefined}
          />
          <ComboPreviewBar
            combo={selectedCombo}
            canManage={canManage}
            onEdit={
              selectedCombo
                ? () => openComboForm('edit', selectedCombo.comboId)
                : undefined
            }
            onRemove={selectedCombo && canManage ? () => removeCombo(selectedCombo) : undefined}
          />
        </>
      ) : null}

      <Text style={styles.footerHint}>{t('meals.library.dailyMenuLaterHint')}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.section },
  title: { ...typography.h2, marginBottom: spacing.xxs },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  loader: { marginBottom: spacing.sm },
  banner: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xxs,
  },
  bannerTitle: { ...typography.bodyStrong },
  bannerBody: { ...typography.caption, color: colors.muted },
  statsSummary: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  footerHint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.sm,
  },
});
