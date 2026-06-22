import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CompositeNavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { FoodCategoryResponse, FoodItemResponse, FoodType, MealComboResponse, UUID } from '../../api/types';
import {
  CategoryChipRail,
  ComboChipRail,
  ComboPreviewBar,
  ItemChipGrid,
  MenuLibraryTabBar,
  type MenuLibraryTab,
} from '../../components/meals';
import { PermissionDeniedScreen } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useMenuLibrary } from '../../hooks/useMenuLibrary';
import { useMainStackNavigation } from '../../hooks/useMainStackNavigation';
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
  const { navigate: navigateMain } = useMainStackNavigation();
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
  const [activeTab, setActiveTab] = useState<MenuLibraryTab>('items');

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const canManage = permissions.canManageMeals === true;
  const inlineBusy = inlineEditor !== null || editingItemId !== null;

  const closeInlineEditors = useCallback(() => {
    setInlineEditor(null);
    setEditingItemId(null);
  }, []);

  const statsSummary = useMemo(() => {
    if (activeTab === 'combos') {
      return t('meals.library.statsCombos', { combos: stats.comboCount });
    }
    return t('meals.library.statsItems', {
      categories: stats.categoryCount,
      items: stats.itemCount,
    });
  }, [activeTab, stats.categoryCount, stats.comboCount, stats.itemCount, t]);

  const handleTabChange = useCallback(
    (tab: MenuLibraryTab) => {
      closeInlineEditors();
      setActiveTab(tab);
    },
    [closeInlineEditors],
  );

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
    async (name: string, foodType: FoodType = 'VEG') => {
      if (!selectedCategoryId) {
        return;
      }
      try {
        await mealsApi.createFoodItem(spaceId, {
          categoryId: selectedCategoryId,
          name,
          foodType,
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
    async (itemId: string, name: string, foodType: FoodType = 'VEG') => {
      try {
        await mealsApi.updateFoodItem(spaceId, itemId, { name, foodType });
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
        <>
          <Text style={styles.statsSummary}>{statsSummary}</Text>
          <MenuLibraryTabBar activeTab={activeTab} onTabChange={handleTabChange} />
        </>
      ) : null}

      {!loading && !loadFailed && activeTab === 'items' && (activeCategories.length > 0 || canManage) ? (
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

          {activeCategories.length > 0 ? (
            <ItemChipGrid
              items={filteredItems}
              categoryName={selectedCategory?.name}
              canManage={canManage}
              onRemoveCategory={
                selectedCategory && canManage
                  ? () => removeCategory(selectedCategory)
                  : undefined
              }
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
          ) : null}
        </>
      ) : null}

      {!loading && !loadFailed && activeTab === 'items' && activeCategories.length === 0 && !canManage ? (
        <Text style={styles.empty}>{t('meals.library.categoriesEmpty')}</Text>
      ) : null}

      {!loading && !loadFailed && activeTab === 'combos' ? (
        <>
          <ComboChipRail
            combos={activeCombos}
            selectedComboId={selectedComboId}
            onSelect={setSelectedComboId}
            canManage={canManage}
            hideTitle
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

      {canManage ? (
        <View style={styles.links}>
          <Pressable
            style={styles.linkRow}
            onPress={() => navigateMain('SubscriptionPlans', { spaceId })}>
            <Text style={styles.linkText}>{t('meals.subscriptionPlans.title')}</Text>
          </Pressable>
        </View>
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
  links: {
    marginTop: spacing.md,
    gap: spacing.xxs,
  },
  linkRow: {
    paddingVertical: spacing.sm,
  },
  linkText: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: '600',
  },
});
