import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, InteractionManager, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CompositeNavigationProp,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { CalendarDays, FolderOpen, PlusCircle } from 'lucide-react-native';
import { mealsApi } from '../../api/mealsApi';
import type { FoodCategoryResponse, FoodItemResponse, FoodType, MealComboResponse, UUID } from '../../api/types';
import {
  LibraryComboSection,
  LibraryItemSection,
  LibraryManageCategoriesSheet,
  LibrarySummaryStrip,
  MenuLibraryTabBar,
  type LibrarySummaryFocus,
  type MenuLibraryTab,
} from '../../components/meals/library';
import { ConfigureLibraryExtrasSheet } from '../../components/meals/ConfigureLibraryExtrasSheet';
import { MenuLibraryReadyTip } from '../../components/meals/MenuLibraryReadyTip';
import { DashboardActionRow } from '../../components/dashboard/shared/DashboardActionRow';
import { EmptyState, PermissionDeniedScreen } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { useMenuLibrary } from '../../hooks/useMenuLibrary';
import { useMainStackNavigation } from '../../hooks/useMainStackNavigation';
import { useMealPricingPolicy } from '../../hooks/useMealPricingPolicy';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { canEditEntityPhoto } from '../../files/entityPhoto';
import type { MainStackParamList, SpaceTabParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { invalidateDashboardQueries } from '../../utils/dashboardQueryCache';
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
    extraItems,
    extraCategories,
    stats,
    reload,
    patchItem,
    filteredItems,
  } = useMenuLibrary(spaceId);

  const [inlineEditor, setInlineEditor] = useState<InlineEditor>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [draftAddCategoryId, setDraftAddCategoryId] = useState<string | null>(null);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MenuLibraryTab>(() => {
    if (initialTab === 'extras' && !mealPricing.requiresMealPrices) {
      return 'items';
    }
    return initialTab ?? 'items';
  });
  const [configureExtrasOpen, setConfigureExtrasOpen] = useState(false);
  const libraryHasContent = stats.itemCount > 0 || stats.comboCount > 0;

  useEffect(() => {
    if (!loading && !loadFailed && libraryHasContent) {
      invalidateDashboardQueries();
    }
  }, [libraryHasContent, loadFailed, loading]);

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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      if (!item.isActive) {
        continue;
      }
      counts[item.categoryId] = (counts[item.categoryId] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const extraCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of extraItems) {
      counts[item.categoryId] = (counts[item.categoryId] ?? 0) + 1;
    }
    return counts;
  }, [extraItems]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const canManage = permissions.canManageMeals === true;
  const canEditPhoto = canEditEntityPhoto(permissions.membershipRole);
  const inlineBusy = inlineEditor !== null || editingItemId !== null;
  const catalogReady = !loading && !loadFailed;

  const closeInlineEditors = useCallback(() => {
    setInlineEditor(null);
    setEditingItemId(null);
  }, []);

  const handleSummarySelect = useCallback(
    (focus: LibrarySummaryFocus) => {
      closeInlineEditors();
      if (focus === 'combos') {
        setManageCategoriesOpen(false);
        setActiveTab('combos');
        return;
      }
      if (focus === 'categories') {
        setActiveTab('items');
        if (canManage) {
          setManageCategoriesOpen(true);
        }
        return;
      }
      setManageCategoriesOpen(false);
      setActiveTab('items');
    },
    [canManage, closeInlineEditors],
  );

  const updateCategory = useCallback(
    async (category: FoodCategoryResponse, name: string) => {
      try {
        await mealsApi.updateFoodCategory(spaceId, category.categoryId, { name });
        showToast(t('meals.library.categoryUpdateSuccess'));
        await reload();
      } catch (error) {
        showToast(t('meals.errors.actionFailed'));
        throw error;
      }
    },
    [reload, showToast, spaceId, t],
  );

  const summarySelected: LibrarySummaryFocus | null = !catalogReady
    ? null
    : manageCategoriesOpen
      ? 'categories'
      : activeTab === 'combos'
        ? 'combos'
        : 'items';

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
    async (name: string, foodType: FoodType = 'VEG', categoryId?: string) => {
      const targetCategoryId = categoryId || selectedCategoryId;
      if (!targetCategoryId) {
        return;
      }
      try {
        await mealsApi.createFoodItem(spaceId, {
          categoryId: targetCategoryId,
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

  const toggleComboInSpace = useCallback(
    (combo: MealComboResponse) => {
      void (async () => {
        try {
          await mealsApi.setMealComboEnabled(spaceId, combo.comboId, combo.enabledForSpace === false);
          await reload();
        } catch {
          showToast(t('meals.errors.actionFailed'));
        }
      })();
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

  const selectCategory = useCallback(
    (categoryId: string) => {
      closeInlineEditors();
      setSelectedCategoryId(categoryId);
    },
    [closeInlineEditors, setSelectedCategoryId],
  );

  const selectAllCategories = useCallback(() => {
    closeInlineEditors();
    setSelectedCategoryId(null);
  }, [closeInlineEditors, setSelectedCategoryId]);

  const startAddItem = useCallback(() => {
    closeInlineEditors();
    setDraftAddCategoryId(selectedCategoryId ?? activeCategories[0]?.categoryId ?? null);
    setInlineEditor('item-add');
  }, [activeCategories, closeInlineEditors, selectedCategoryId]);

  if (!permissions.canViewMeals) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  return (
    <>
      <Screen scrollable contentStyle={styles.content}>
        {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {loadFailed ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>{t('meals.library.backendPending')}</Text>
            <Text style={styles.bannerBody}>{t('meals.library.backendPendingHint')}</Text>
          </View>
        ) : null}

        {catalogReady && stats.itemCount === 0 ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>{t('meals.library.seedHint')}</Text>
            <Text style={styles.bannerBody}>{t('meals.library.seedHintBody')}</Text>
          </View>
        ) : null}

        {catalogReady ? (
          <LibrarySummaryStrip
            categoryCount={stats.categoryCount}
            itemCount={stats.itemCount}
            comboCount={stats.comboCount}
            categoriesLabel={t('meals.library.categories')}
            itemsLabel={t('meals.library.tabItems')}
            combosLabel={t('meals.library.tabCombos')}
            selected={summarySelected}
            onSelect={handleSummarySelect}
          />
        ) : null}

        {catalogReady && libraryHasContent ? (
          <MenuLibraryReadyTip
            spaceId={spaceId}
            visible
            onContinuePlanning={() => {
              navigateMain('MenuPlanning', { spaceId });
            }}
          />
        ) : null}

        {catalogReady ? (
          <MenuLibraryTabBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            showExtras={showExtrasTab}
            counts={{
              items: stats.itemCount,
              combos: stats.comboCount,
              extras: stats.extraCount,
            }}
          />
        ) : null}

        {catalogReady && activeTab === 'items' && (activeCategories.length > 0 || canManage) ? (
          <LibraryItemSection
            items={filteredItems}
            categories={activeCategories}
            selectedCategoryId={selectedCategoryId}
            totalItemCount={stats.itemCount}
            countByCategoryId={categoryCounts}
            canManage={canManage}
            spaceId={spaceId}
            canEditPhoto={canEditPhoto}
            isAdding={inlineEditor === 'item-add'}
            editingItemId={editingItemId}
            addDisabled={inlineBusy && inlineEditor !== 'item-add'}
            showCategoryTools
            showAddItem={activeCategories.length > 0}
            includeAll
            removeLabel={t('meals.library.removeItem')}
            emptyLabel={
              activeCategories.length === 0
                ? t('meals.library.categoriesEmpty')
                : t('meals.library.itemsEmptyCategory')
            }
            formatTitle={count =>
              selectedCategory
                ? t('meals.library.categoryItemsTitle', {
                    category: selectedCategory.name,
                    count,
                  })
                : t('meals.library.allMenuItems', { count })
            }
            onSelectCategory={selectCategory}
            onSelectAll={selectAllCategories}
            onManageCategories={() => setManageCategoriesOpen(true)}
            onStartAdd={startAddItem}
            onCancelAdd={closeInlineEditors}
            onSaveItem={saveItem}
            onStartEdit={item => {
              setInlineEditor(null);
              setEditingItemId(item.itemId);
            }}
            onCancelEdit={closeInlineEditors}
            onUpdateItem={updateItem}
            onRemoveItem={canManage ? removeItem : undefined}
            onRemoveCategory={canManage ? removeCategory : undefined}
            onPhotoChanged={() => void reload()}
            addCategoryId={selectedCategoryId ?? draftAddCategoryId}
            isAddingCategory={inlineEditor === 'category'}
            onSaveCategory={saveCategory}
            onCancelCategory={closeInlineEditors}
          />
        ) : null}

        {catalogReady && activeTab === 'items' && activeCategories.length === 0 && !canManage ? (
          <EmptyState title={t('meals.library.categoriesEmpty')} Icon={FolderOpen} />
        ) : null}

        {catalogReady && activeTab === 'combos' ? (
          <LibraryComboSection
            combos={activeCombos}
            selectedComboId={selectedComboId}
            canManage={canManage}
            spaceId={spaceId}
            canEditPhoto={canEditPhoto}
            onSelect={setSelectedComboId}
            onAdd={() => openComboForm('create')}
            onEdit={combo => openComboForm('edit', combo.comboId)}
            onToggle={canManage ? toggleComboInSpace : undefined}
            onRemove={canManage ? removeCombo : undefined}
            onPhotoChanged={() => void reload()}
          />
        ) : null}

        {catalogReady && showExtrasTab && activeTab === 'extras' ? (
          <>
            {stats.extraCount === 0 ? (
              <>
                <EmptyState
                  title={t('meals.library.extrasEmpty')}
                  description={t('meals.library.extrasEmptyBody')}
                  Icon={PlusCircle}
                />
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
              </>
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
                <LibraryItemSection
                  items={extrasVisibleItems}
                  categories={extraCategories}
                  selectedCategoryId={extrasSelectedCategoryId}
                  totalItemCount={stats.extraCount}
                  countByCategoryId={extraCounts}
                  canManage={canManage}
                  spaceId={spaceId}
                  canEditPhoto={canEditPhoto}
                  isAdding={false}
                  editingItemId={editingItemId}
                  addDisabled
                  showCategoryTools={false}
                  showAddItem={false}
                  includeAll={false}
                  removeLabel={t('meals.library.removeExtra')}
                  emptyLabel={t('meals.library.itemsEmptyCategory')}
                  formatTitle={count => {
                    const category = extraCategories.find(
                      row => row.categoryId === extrasSelectedCategoryId,
                    );
                    return category
                      ? t('meals.library.categoryItemsTitle', {
                          category: category.name,
                          count,
                        })
                      : t('meals.library.extrasHeading', { count });
                  }}
                  onSelectCategory={selectCategory}
                  onCancelAdd={closeInlineEditors}
                  onSaveItem={saveItem}
                  onStartEdit={item => {
                    setInlineEditor(null);
                    setEditingItemId(item.itemId);
                  }}
                  onCancelEdit={closeInlineEditors}
                  onUpdateItem={updateItem}
                  onRemoveItem={canManage ? removeExtra : undefined}
                  onPhotoChanged={() => void reload()}
                  addCategoryId={extrasSelectedCategoryId}
                />
              </>
            )}
          </>
        ) : null}

        {canManage ? (
          <View style={styles.links} testID="library-subscription">
            <DashboardActionRow
              icon={CalendarDays}
              accent="#0D9488"
              title={t('meals.subscriptionPlans.title')}
              subtitle={t('meals.subscriptionPlans.ownerSubtitle')}
              onPress={() => navigateMain('SubscriptionPlans', { spaceId })}
            />
          </View>
        ) : null}

        <Text style={styles.footerHint}>{t('meals.library.dailyMenuLaterHint')}</Text>
      </Screen>

      {canManage ? (
        <LibraryManageCategoriesSheet
          visible={manageCategoriesOpen}
          categories={activeCategories}
          countByCategoryId={categoryCounts}
          onClose={() => setManageCategoriesOpen(false)}
          onAdd={() => {
            setManageCategoriesOpen(false);
            closeInlineEditors();
            setInlineEditor('category');
          }}
          onEdit={updateCategory}
          onRemove={category => {
            setManageCategoriesOpen(false);
            InteractionManager.runAfterInteractions(() => {
              removeCategory(category);
            });
          }}
        />
      ) : null}

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
  loader: { marginBottom: spacing.sm },
  banner: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.xxs,
  },
  bannerTitle: { ...typography.bodyStrong },
  bannerBody: { ...typography.caption, color: colors.muted },
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
    marginTop: spacing.sm,
    gap: spacing.xxs,
  },
});
