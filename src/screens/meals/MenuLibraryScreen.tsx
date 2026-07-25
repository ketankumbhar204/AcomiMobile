import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ConfigureLibraryExtrasSheet } from '../../components/meals/ConfigureLibraryExtrasSheet';
import { PermissionDeniedScreen } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useMenuLibrary } from '../../hooks/useMenuLibrary';
import { useMainStackNavigation } from '../../hooks/useMainStackNavigation';
import { useMealPricingPolicy } from '../../hooks/useMealPricingPolicy';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';

type MenuLibraryScreenProps = {
  spaceId: UUID;
  initialTab?: MenuLibraryTab;
};

type MenuLibraryNav = CompositeNavigationProp<
  BottomTabNavigationProp<SpaceTabParamList, 'Meals'>,
  NativeStackNavigationProp<MainStackParamList>
>;

type InlineEditor = 'category' | 'item-add' | null;

export function MenuLibraryScreen({ spaceId, initialTab }: MenuLibraryScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<MenuLibraryNav>();
  const { navigate: navigateMain } = useMainStackNavigation();
  const permissions = useSpacePermissions(spaceId);
  const mealPricing = useMealPricingPolicy(spaceId);
  const showExtrasTab = mealPricing.requiresMealPrices;
  const showToast = useToastStore(state => state.showToast);

  const {
    loading,
    loadFailed,
    items,
    activeCategories,
    activeCombos,
    selectedCategoryId,
    setSelectedCategoryId,
    selectedCategory,
    selectedComboId,
    setSelectedComboId,
    selectedCombo,
    filteredItems,
    extraItems,
    extraCategories,
    stats,
    reload,
    patchItem,
  } = useMenuLibrary(spaceId);

  const [inlineEditor, setInlineEditor] = useState<InlineEditor>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MenuLibraryTab>(() => {
    if (initialTab === 'extras' && !mealPricing.requiresMealPrices) {
      return 'items';
    }
    return initialTab ?? 'items';
  });
  const [configureExtrasOpen, setConfigureExtrasOpen] = useState(false);

  useEffect(() => {
    if (!initialTab) {
      return;
    }
    if (initialTab === 'extras' && !showExtrasTab) {
      setActiveTab('items');
      return;
    }
    setActiveTab(initialTab);
  }, [initialTab, showExtrasTab]);

  const extrasSelectedCategoryId = useMemo(() => {
    if (extraCategories.length === 0) {
      return null;
    }
    if (
      selectedCategoryId &&
      extraCategories.some(category => category.categoryId === selectedCategoryId)
    ) {
      return selectedCategoryId;
    }
    return extraCategories[0].categoryId;
  }, [extraCategories, selectedCategoryId]);

  const extrasVisibleItems = useMemo(() => {
    if (!extrasSelectedCategoryId) {
      return extraItems;
    }
    return extraItems.filter(item => item.categoryId === extrasSelectedCategoryId);
  }, [extraItems, extrasSelectedCategoryId]);

  const extrasSelectedCategory = useMemo(
    () =>
      extraCategories.find(category => category.categoryId === extrasSelectedCategoryId) ?? null,
    [extraCategories, extrasSelectedCategoryId],
  );

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
    if (activeTab === 'extras') {
      return t('meals.library.statsExtras', { count: stats.extraCount });
    }
    return t('meals.library.statsItems', {
      categories: stats.categoryCount,
      items: stats.itemCount,
    });
  }, [activeTab, stats.categoryCount, stats.comboCount, stats.extraCount, stats.itemCount, t]);

  const handleTabChange = useCallback(
    (tab: MenuLibraryTab) => {
      closeInlineEditors();
      if (!showExtrasTab && tab === 'extras') {
        setActiveTab('items');
        return;
      }
      if (tab !== 'extras') {
        setConfigureExtrasOpen(false);
      }
      setActiveTab(tab);
    },
    [closeInlineEditors, showExtrasTab],
  );

  useEffect(() => {
    if (!showExtrasTab && activeTab === 'extras') {
      setActiveTab('items');
    }
  }, [activeTab, showExtrasTab]);

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
          ...(activeTab === 'extras' ? { isExtra: true } : {}),
        });
        showToast(
          activeTab === 'extras'
            ? t('meals.library.extraCreateSuccess')
            : t('meals.library.itemCreateSuccess'),
        );
        closeInlineEditors();
        await reload();
      } catch {
        showToast(t('meals.errors.actionFailed'));
      }
    },
    [activeTab, closeInlineEditors, reload, selectedCategoryId, showToast, spaceId, t],
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

  const removeExtra = useCallback(
    (item: FoodItemResponse) => {
      Alert.alert(
        t('meals.library.removeExtra'),
        t('meals.library.removeExtraConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('meals.library.removeExtra'),
            style: 'destructive',
            onPress: () => {
              void (async () => {
                try {
                  await mealsApi.updateFoodItemExtra(spaceId, item.itemId, { isExtra: false });
                  showToast(t('meals.library.extraRemoveSuccess'));
                  await reload();
                } catch {
                  showToast(t('meals.errors.actionFailed'));
                }
              })();
            },
          },
        ],
      );
    },
    [reload, showToast, spaceId, t],
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
    <>
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
          <MenuLibraryTabBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            showExtras={showExtrasTab}
          />
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

      {!loading && !loadFailed && showExtrasTab && activeTab === 'extras' ? (
        <>
          <Text style={styles.extrasHint}>{t('meals.library.extrasTabHint')}</Text>

          {stats.extraCount === 0 ? (
            <View style={styles.extrasEmptyCard}>
              <Text style={styles.extrasEmptyTitle}>{t('meals.library.extrasEmpty')}</Text>
              <Text style={styles.extrasEmptyBody}>{t('meals.library.extrasEmptyBody')}</Text>
              {canManage ? (
                <Pressable
                  style={styles.configureExtrasButton}
                  onPress={() => setConfigureExtrasOpen(true)}
                  accessibilityRole="button">
                  <Text style={styles.configureExtrasButtonText}>
                    {t('meals.library.configureExtrasCta')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <>
              {canManage ? (
                <Pressable
                  style={styles.configureExtrasButtonSecondary}
                  onPress={() => setConfigureExtrasOpen(true)}
                  accessibilityRole="button">
                  <Text style={styles.configureExtrasButtonSecondaryText}>
                    {t('meals.library.configureExtrasManageCta')}
                  </Text>
                </Pressable>
              ) : null}

              {extraCategories.length > 0 ? (
                <>
                  <CategoryChipRail
                    categories={extraCategories}
                    selectedCategoryId={extrasSelectedCategoryId}
                    onSelect={categoryId => {
                      closeInlineEditors();
                      setSelectedCategoryId(categoryId);
                    }}
                    canManage={false}
                  />

                  {extrasSelectedCategoryId ? (
                    <ItemChipGrid
                      items={extrasVisibleItems}
                      categoryName={extrasSelectedCategory?.name}
                      canManage={canManage}
                      isAdding={false}
                      editingItemId={editingItemId}
                      onCancelAdd={closeInlineEditors}
                      onSaveItem={saveItem}
                      onStartEdit={item => {
                        setInlineEditor(null);
                        setEditingItemId(item.itemId);
                      }}
                      onCancelEdit={closeInlineEditors}
                      onUpdateItem={updateItem}
                      onRemoveItem={canManage ? removeExtra : undefined}
                    />
                  ) : null}
                </>
              ) : null}
            </>
          )}
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

    {showExtrasTab && configureExtrasOpen ? (
      <ConfigureLibraryExtrasSheet
        visible
        spaceId={spaceId}
        items={items}
        categories={activeCategories}
        onClose={() => setConfigureExtrasOpen(false)}
        onItemUpdated={patchItem}
      />
    ) : null}
    </>
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
  extrasHint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  extrasEmptyCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  extrasEmptyTitle: {
    ...typography.bodyStrong,
  },
  extrasEmptyBody: {
    ...typography.caption,
    color: colors.muted,
  },
  configureExtrasButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  configureExtrasButtonText: {
    ...typography.bodyStrong,
    color: colors.white,
  },
  configureExtrasButtonSecondary: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  configureExtrasButtonSecondaryText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
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
