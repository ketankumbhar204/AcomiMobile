import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type {
  FoodCategoryResponse,
  FoodItemResponse,
  FoodType,
  MealComboResponse,
  UUID,
} from '../../api/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { MenuAdHocPackage, MenuDraftOption, MenuSelectionItemPackage } from '../../utils/dailyMenuDraft';
import {
  getEffectivePriceDraft,
  hasComboPrice,
  parsePriceInput,
  validatePriceInput,
} from '../../utils/comboPrice';
import { isMenuSelectionFullyResolved } from '../../utils/menuSelectionSync';
import {
  collectSelectionPriceErrors,
  firstPriceErrorTarget,
} from '../../utils/menuSelectionPriceValidation';
import {
  comboPriceDraftErrorMessage,
  persistComboPriceDraft,
  type ComboPriceDraftErrors,
} from '../../utils/comboSelectionPricing';
import { persistItemPriceDraft } from '../../utils/itemSelectionPricing';
import { agentDebugLog } from '../../utils/agentDebugLog';
import { fetchSpaceMenuCatalog } from '../../utils/fetchSpaceMenuCatalog';
import { formatComboIncludeLine } from '../../utils/comboIncludes';
import { ComboPickerCard } from './ComboPickerCard';
import { CreateComboSheet } from './CreateComboSheet';
import { PlanningItemPickerList } from './PlanningItemPickerList';
import { MenuSelectionSummary } from './MenuSelectionSummary';
import { MenuSelectionTabBar, type MenuSelectionTab } from './MenuSelectionTabBar';

export type MenuSelectionSaveResult = {
  combos: MealComboResponse[];
  itemPackages: MenuSelectionItemPackage[];
  extraPackages: MenuSelectionItemPackage[];
  adHocPackages: MenuAdHocPackage[];
};

export type MenuSelectionPanelHandle = {
  /** Mess-only: validate selected price fields; highlights errors and focuses first invalid. */
  validatePrices: () => boolean;
  hasSelection: () => boolean;
  getSelectionResult: () => MenuSelectionSaveResult;
  getDraftPrices: () => Record<string, string>;
};

type MenuSelectionPanelProps = {
  spaceId: UUID;
  initialOptions: MenuDraftOption[];
  onChange: (result: MenuSelectionSaveResult) => void;
  requiresMealPrices?: boolean;
  onSelectionPresenceChange?: (hasSelection: boolean) => void;
};

function adHocPackageChipId(label: string): string {
  return `package:${label}`;
}

function defaultTabForSeed(seed: ReturnType<typeof seedFromOptions>): MenuSelectionTab {
  if (
    seed.selectedItemIds.length > 0 &&
    seed.selectedComboIds.length === 0 &&
    seed.adHocPackages.length === 0
  ) {
    return 'items';
  }
  return 'combos';
}

function seedFromOptions(options: MenuDraftOption[]) {
  const existingComboIds = options
    .filter(option => option.entryType === 'COMBO' && option.comboId)
    .map(option => option.comboId as string);
  const existingItemPackages = options.filter(
    option =>
      option.entryType === 'PACKAGE' &&
      option.isExtra !== true &&
      option.itemIds?.length === 1,
  );
  const existingAdHocPackages = options.filter(
    option =>
      option.entryType === 'PACKAGE' &&
      option.isExtra !== true &&
      (option.itemIds?.length ?? 0) > 1,
  );
  const existingItemIds = existingItemPackages
    .map(option => option.itemIds?.[0])
    .filter((id): id is string => Boolean(id));

  return {
    selectedComboIds: existingComboIds,
    selectedItemIds: existingItemIds,
    adHocPackages: existingAdHocPackages.map(option => ({
      label: option.label,
      itemIds: option.itemIds ?? [],
      price: option.price ?? null,
      currencyCode: option.currencyCode ?? 'INR',
    })),
    draftPrices: {
      ...existingItemPackages.reduce<Record<string, string>>((acc, option) => {
        const itemId = option.itemIds?.[0];
        if (itemId && option.price != null) {
          acc[itemId] = String(option.price);
        }
        return acc;
      }, {}),
      ...options
        .filter(option => option.entryType === 'COMBO' && option.comboId)
        .reduce<Record<string, string>>((acc, option) => {
          const comboId = option.comboId as string;
          if (option.price != null) {
            acc[comboId] = String(option.price);
          }
          return acc;
        }, {}),
    },
  };
}

export const MenuSelectionPanel = forwardRef<MenuSelectionPanelHandle, MenuSelectionPanelProps>(
  function MenuSelectionPanel(
    {
      spaceId,
      initialOptions,
      onChange,
      requiresMealPrices = true,
      onSelectionPresenceChange,
    },
    ref,
  ) {
  const seed = seedFromOptions(initialOptions);
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);
  const [loading, setLoading] = useState(true);
  const [createComboOpen, setCreateComboOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MenuSelectionTab>(() => defaultTabForSeed(seed));
  const [combos, setCombos] = useState<MealComboResponse[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItemResponse[]>([]);
  const [categories, setCategories] = useState<FoodCategoryResponse[]>([]);
  const [selectedComboIds, setSelectedComboIds] = useState<string[]>(seed.selectedComboIds);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(seed.selectedItemIds);
  const [adHocPackages, setAdHocPackages] = useState<MenuAdHocPackage[]>(seed.adHocPackages);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>(seed.draftPrices);
  const [priceErrors, setPriceErrors] = useState<ComboPriceDraftErrors>({});
  const [focusPriceInputId, setFocusPriceInputId] = useState<string | null>(null);
  const [comboSearch, setComboSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const itemPriceSaveInFlightRef = useRef<Set<string>>(new Set());
  const comboPriceSaveInFlightRef = useRef<Set<string>>(new Set());
  const focusClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTabChange = useCallback((tab: MenuSelectionTab) => {
    Keyboard.dismiss();
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void fetchSpaceMenuCatalog(spaceId)
      .then(catalog => {
        if (!active) {
          return;
        }
        setCombos(catalog.combos.filter(combo => combo.isActive));
        setFoodItems(catalog.items.filter(item => item.isActive));
        setCategories(catalog.categories.filter(category => category.isActive));
        agentDebugLog({
          hypothesisId: 'D',
          location: 'MenuSelectionPanel.tsx:loadCatalog',
          message: 'Loaded space-scoped menu catalog',
          data: {
            spaceId,
            comboSample: catalog.combos.slice(0, 3).map(combo => ({
              comboId: combo.comboId,
              name: combo.name,
              price: combo.price ?? null,
            })),
            itemSample: catalog.items.slice(0, 3).map(item => ({
              itemId: item.itemId,
              name: item.name,
              defaultPrice: item.defaultPrice ?? null,
            })),
          },
        });
      })
      .catch(() => {})
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [spaceId]);

  useEffect(() => {
    if (loading) {
      return;
    }
    setDraftPrices(prev => {
      const next = { ...prev };
      let changed = false;
      for (const itemId of selectedItemIds) {
        if (next[itemId]?.trim()) {
          continue;
        }
        const item = foodItems.find(row => row.itemId === itemId);
        if (item && hasComboPrice(item.defaultPrice)) {
          next[itemId] = String(item.defaultPrice);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [foodItems, loading, selectedItemIds]);

  const addItemInline = useCallback(
    async (categoryId: string, itemName: string, foodType: FoodType = 'VEG') => {
      try {
        const created = await mealsApi.createFoodItem(spaceId, {
          categoryId,
          name: itemName,
          foodType,
        });
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

  const selectedCombos = useMemo(
    () =>
      selectedComboIds
        .map(id => combos.find(combo => combo.comboId === id))
        .filter((combo): combo is MealComboResponse => combo != null),
    [combos, selectedComboIds],
  );

  const selectedItems = useMemo(
    () =>
      selectedItemIds
        .map(id => foodItems.find(item => item.itemId === id))
        .filter((item): item is FoodItemResponse => item != null),
    [foodItems, selectedItemIds],
  );

  const comboChips = useMemo(
    () => [
      ...selectedCombos.map(combo => ({
        id: combo.comboId,
        label: combo.name,
        variant: 'COMBO' as const,
      })),
      ...adHocPackages.map(pkg => ({
        id: adHocPackageChipId(pkg.label),
        label: pkg.label,
        variant: 'COMBO' as const,
      })),
    ],
    [adHocPackages, selectedCombos],
  );

  const itemChips = useMemo(
    () =>
      selectedItems.map(item => ({
        id: item.itemId,
        label: item.name,
        variant: 'ITEM' as const,
      })),
    [selectedItems],
  );

  const buildSelectionResult = useMemo((): MenuSelectionSaveResult => {
    const itemPackages: MenuSelectionItemPackage[] = [];
    for (const item of selectedItems) {
      const draft = getEffectivePriceDraft(item.itemId, draftPrices, item.defaultPrice ?? null);
      const price = draft ? parsePriceInput(draft) : null;
      if (requiresMealPrices && (price == null || price <= 0)) {
        continue;
      }
      itemPackages.push({
        itemId: item.itemId,
        name: item.name,
        price,
        currencyCode: 'INR',
        foodType: item.foodType ?? null,
      });
    }
    return {
      combos: selectedCombos,
      itemPackages,
      extraPackages: [],
      adHocPackages,
    };
  }, [adHocPackages, draftPrices, requiresMealPrices, selectedCombos, selectedItems]);

  const hasAnySelection =
    selectedComboIds.length > 0 ||
    selectedItemIds.length > 0 ||
    adHocPackages.length > 0;

  useEffect(() => {
    onSelectionPresenceChange?.(hasAnySelection);
  }, [hasAnySelection, onSelectionPresenceChange]);

  useEffect(() => {
    return () => {
      if (focusClearTimerRef.current) {
        clearTimeout(focusClearTimerRef.current);
      }
    };
  }, []);

  const requestFocusPriceInput = useCallback((id: string) => {
    if (focusClearTimerRef.current) {
      clearTimeout(focusClearTimerRef.current);
    }
    setFocusPriceInputId(id);
    focusClearTimerRef.current = setTimeout(() => {
      setFocusPriceInputId(null);
      focusClearTimerRef.current = null;
    }, 600);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      validatePrices: () => {
        if (!requiresMealPrices) {
          setPriceErrors({});
          return true;
        }
        const errors = collectSelectionPriceErrors({
          requiresMealPrices,
          selectedCombos,
          selectedItems,
          adHocPackages,
          draftPrices,
        });
        setPriceErrors(errors);
        const target = firstPriceErrorTarget(errors, selectedComboIds, selectedItemIds);
        if (!target) {
          return true;
        }
        setActiveTab(target.tab);
        requestFocusPriceInput(target.id);
        return false;
      },
      hasSelection: () => hasAnySelection,
      getSelectionResult: () => buildSelectionResult,
      getDraftPrices: () => ({ ...draftPrices }),
    }),
    [
      adHocPackages,
      buildSelectionResult,
      draftPrices,
      hasAnySelection,
      requestFocusPriceInput,
      requiresMealPrices,
      selectedComboIds,
      selectedCombos,
      selectedItemIds,
      selectedItems,
    ],
  );

  useEffect(() => {
    if (loading) {
      return;
    }
    if (
      hasAnySelection &&
      !isMenuSelectionFullyResolved(
        selectedComboIds,
        selectedItemIds,
        combos,
        draftPrices,
        adHocPackages,
        requiresMealPrices,
      )
    ) {
      return;
    }
    onChange(buildSelectionResult);
  }, [
    adHocPackages,
    buildSelectionResult,
    combos,
    draftPrices,
    hasAnySelection,
    loading,
    onChange,
    selectedComboIds,
    selectedItemIds,
    requiresMealPrices,
  ]);

  const filteredCombos = useMemo(() => {
    const query = comboSearch.trim().toLowerCase();
    if (!query) {
      return combos;
    }
    return combos.filter(combo => combo.name.toLowerCase().includes(query));
  }, [comboSearch, combos]);

  const toggleCombo = (comboId: string) => {
    setSelectedComboIds(prev => {
      if (prev.includes(comboId)) {
        setDraftPrices(current => {
          const next = { ...current };
          delete next[comboId];
          return next;
        });
        setPriceErrors(current => {
          const next = { ...current };
          delete next[comboId];
          return next;
        });
        return prev.filter(id => id !== comboId);
      }

      const combo = combos.find(row => row.comboId === comboId);
      if (combo && hasComboPrice(combo.price)) {
        setDraftPrices(current => ({
          ...current,
          [comboId]: current[comboId] ?? String(combo.price),
        }));
      }

      return [...prev, comboId];
    });
  };

  const toggleItem = (itemId: string) => {
    setSelectedItemIds(prev => {
      if (prev.includes(itemId)) {
        setDraftPrices(current => {
          const next = { ...current };
          delete next[itemId];
          return next;
        });
        setPriceErrors(current => {
          const next = { ...current };
          delete next[itemId];
          return next;
        });
        return prev.filter(id => id !== itemId);
      }

      const item = foodItems.find(row => row.itemId === itemId);
      if (item && hasComboPrice(item.defaultPrice)) {
        setDraftPrices(current => ({
          ...current,
          [itemId]: current[itemId] ?? String(item.defaultPrice),
        }));
      }

      return [...prev, itemId];
    });
  };

  const removeSelection = (id: string) => {
    if (selectedComboIds.includes(id)) {
      toggleCombo(id);
      return;
    }
    if (selectedItemIds.includes(id)) {
      toggleItem(id);
      return;
    }
    if (id.startsWith('package:')) {
      const label = id.slice('package:'.length);
      setAdHocPackages(prev => prev.filter(pkg => pkg.label !== label));
    }
  };

  const updateDraftPrice = (id: string, text: string) => {
    setDraftPrices(prev => ({ ...prev, [id]: text }));
    setPriceErrors(prev => {
      if (!prev[id]) {
        return prev;
      }
      const trimmed = text.trim();
      if (!trimmed) {
        return { ...prev, [id]: 'required' };
      }
      const validation = validatePriceInput(trimmed);
      if (!validation) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return {
        ...prev,
        [id]: validation === 'nonPositive' ? 'nonPositive' : 'invalid',
      };
    });
  };

  const persistPriceOnBlur = async (combo: MealComboResponse, draftValue: string) => {
    const normalizedDraft = draftValue.trim();
    setDraftPrices(prev => ({ ...prev, [combo.comboId]: normalizedDraft }));

    if (comboPriceSaveInFlightRef.current.has(combo.comboId)) {
      return;
    }

    const parsedPrice = parsePriceInput(normalizedDraft);
    if (
      parsedPrice != null &&
      hasComboPrice(combo.price) &&
      Number(combo.price) === parsedPrice
    ) {
      return;
    }

    comboPriceSaveInFlightRef.current.add(combo.comboId);
    try {
      const draftsForSave = { ...draftPrices, [combo.comboId]: normalizedDraft };
      const { combo: updated, error } = await persistComboPriceDraft(
        spaceId,
        combo,
        draftsForSave,
      );
      if (error) {
        if (error === 'required' && !requiresMealPrices) {
          return;
        }
        setPriceErrors(prev => ({ ...prev, [combo.comboId]: error }));
        if (error === 'invalid') {
          showToast(t('meals.errors.saveFailed'));
        }
        return;
      }
      setCombos(prev => prev.map(row => (row.comboId === updated.comboId ? updated : row)));
      setDraftPrices(prev => ({
        ...prev,
        [combo.comboId]: hasComboPrice(updated.price) ? String(updated.price) : normalizedDraft,
      }));
      setPriceErrors(prev => {
        const next = { ...prev };
        delete next[combo.comboId];
        return next;
      });
    } finally {
      comboPriceSaveInFlightRef.current.delete(combo.comboId);
    }
  };

  const persistItemPriceOnBlur = async (item: FoodItemResponse, draftValue: string) => {
    const normalizedDraft = draftValue.trim();
    setDraftPrices(prev => ({ ...prev, [item.itemId]: normalizedDraft }));

    if (itemPriceSaveInFlightRef.current.has(item.itemId)) {
      return;
    }

    const parsedPrice = parsePriceInput(normalizedDraft);
    if (
      parsedPrice != null &&
      hasComboPrice(item.defaultPrice) &&
      Number(item.defaultPrice) === parsedPrice
    ) {
      return;
    }

    itemPriceSaveInFlightRef.current.add(item.itemId);
    try {
      const draftsForSave = { ...draftPrices, [item.itemId]: normalizedDraft };
      const { item: updated, error } = await persistItemPriceDraft(spaceId, item, draftsForSave);
      if (error) {
        if (error === 'required' && !requiresMealPrices) {
          return;
        }
        setPriceErrors(prev => ({ ...prev, [item.itemId]: error }));
        if (error === 'invalid') {
          showToast(t('meals.errors.saveFailed'));
        }
        return;
      }
      setFoodItems(prev => prev.map(row => (row.itemId === updated.itemId ? updated : row)));
      const nextDraft = hasComboPrice(updated.defaultPrice)
        ? String(updated.defaultPrice)
        : normalizedDraft;
      setDraftPrices(prev => ({
        ...prev,
        [item.itemId]: nextDraft,
      }));
      setPriceErrors(prev => {
        const next = { ...prev };
        delete next[item.itemId];
        return next;
      });
    } finally {
      itemPriceSaveInFlightRef.current.delete(item.itemId);
    }
  };

  const handleComboCreated = (combo: MealComboResponse) => {
    setCombos(prev => {
      const exists = prev.some(row => row.comboId === combo.comboId);
      return exists ? prev.map(row => (row.comboId === combo.comboId ? combo : row)) : [...prev, combo];
    });
    setSelectedComboIds(prev =>
      prev.includes(combo.comboId) ? prev : [...prev, combo.comboId],
    );
    if (hasComboPrice(combo.price)) {
      setDraftPrices(prev => ({
        ...prev,
        [combo.comboId]: prev[combo.comboId] ?? String(combo.price),
      }));
    }
  };

  const handleAdHocPackageCreated = (payload: {
    label: string;
    itemIds: string[];
    price?: number | null;
  }) => {
    setAdHocPackages(prev => [
      ...prev.filter(pkg => pkg.label !== payload.label),
      {
        label: payload.label,
        itemIds: payload.itemIds,
        price: payload.price ?? null,
        currencyCode: 'INR',
      },
    ]);
  };

  const handleCreateComboSave = async (
    name: string,
    itemIds: string[],
    saveToLibrary: boolean,
    price?: number | null,
    itemQuantities?: Array<{ itemId: string; quantity: number }>,
  ) => {
    try {
      if (saveToLibrary) {
        const created = await mealsApi.createMealCombo(spaceId, {
          name,
          description: null,
          itemIds,
          ...(itemQuantities?.length ? { itemQuantities } : {}),
          price: price ?? null,
          currencyCode: 'INR',
        });
        handleComboCreated(created);
        showToast(t('meals.planning.comboSavedToLibrary', { name }));
      } else {
        handleAdHocPackageCreated({ label: name, itemIds, price: price ?? null });
        showToast(t('meals.planning.comboAdded', { name }));
      }
      const catalog = await fetchSpaceMenuCatalog(spaceId, { force: true });
      setFoodItems(catalog.items.filter(item => item.isActive));
      setCategories(catalog.categories.filter(category => category.isActive));
      setCombos(catalog.combos.filter(combo => combo.isActive));
    } catch {
      showToast(t('meals.errors.saveFailed'));
      throw new Error('createCombo failed');
    }
  };

  return (
    <>
    <View style={styles.panel}>
      <MenuSelectionSummary
        comboChips={comboChips}
        itemChips={itemChips}
        onRemove={removeSelection}
      />

      <MenuSelectionTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <View style={styles.divider} />

      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {!loading && activeTab === 'combos' ? (
        <View>
          <Text style={styles.sectionTitle}>{t('meals.planning.savedCombosTitle')}</Text>
          <TextInput
            style={styles.search}
            value={comboSearch}
            onChangeText={setComboSearch}
            placeholder={t('meals.planning.searchCombos')}
            placeholderTextColor={colors.muted}
          />

          {filteredCombos.map(combo => {
            const selected = selectedComboIds.includes(combo.comboId);
            const errorKey = priceErrors[combo.comboId];
            const priceDraft = getEffectivePriceDraft(combo.comboId, draftPrices, combo.price);
            return (
              <ComboPickerCard
                key={combo.comboId}
                name={combo.name}
                itemNames={
                  combo.items
                    ?.map(item => formatComboIncludeLine(item.name, item.quantity))
                    .filter(Boolean) ?? []
                }
                foodType={combo.foodType ?? 'VEG'}
                price={combo.price}
                currencyCode={combo.currencyCode}
                selected={selected}
                editablePrice={selected && requiresMealPrices}
                requiresPriceInput={false}
                showMealPrices={requiresMealPrices}
                priceDraft={priceDraft}
                onPriceDraftChange={text => updateDraftPrice(combo.comboId, text)}
                onPriceBlur={
                  selected && requiresMealPrices
                    ? draft => {
                        void persistPriceOnBlur(combo, draft);
                      }
                    : undefined
                }
                priceInputError={
                  errorKey ? comboPriceDraftErrorMessage(errorKey, t) : null
                }
                focusPriceInput={focusPriceInputId === combo.comboId}
                onPress={() => toggleCombo(combo.comboId)}
              />
            );
          })}

          {filteredCombos.length === 0 ? (
            <Text style={styles.empty}>{t('meals.library.combosEmpty')}</Text>
          ) : null}

          <Pressable
            style={styles.createComboLink}
            onPress={() => setCreateComboOpen(true)}>
            <Text style={styles.createComboLinkText}>{t('meals.planning.createNewCombo')}</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && activeTab === 'items' ? (
        <View>
          <Text style={styles.sectionTitle}>{t('meals.planning.individualItemsTitle')}</Text>
          <TextInput
            style={styles.search}
            value={itemSearch}
            onChangeText={setItemSearch}
            placeholder={t('meals.planning.searchItems')}
            placeholderTextColor={colors.muted}
          />

          <PlanningItemPickerList
            items={foodItems}
            categories={categories}
            selectedIds={selectedItemIds}
            searchQuery={itemSearch}
            draftPrices={draftPrices}
            priceErrors={priceErrors}
            focusPriceInputId={focusPriceInputId}
            onToggle={toggleItem}
            onPriceChange={updateDraftPrice}
            onPriceBlur={(item, draft) => {
              void persistItemPriceOnBlur(item, draft);
            }}
            showMealPrices={requiresMealPrices}
            canAddItem
            canAddCategory
            onAddItem={addItemInline}
            onAddCategory={addCategoryInline}
          />
        </View>
      ) : null}
    </View>

    <CreateComboSheet
      visible={createComboOpen}
      spaceId={spaceId}
      existingOptions={initialOptions}
      onClose={() => setCreateComboOpen(false)}
      onSave={handleCreateComboSave}
      submitLabel={t('meals.planning.createComboButton')}
    />
    </>
  );
});


const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  loader: { marginVertical: spacing.lg },
  sectionTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
  },
  search: {
    ...typography.body,
    fontSize: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minHeight: 40,
    marginBottom: spacing.md,
  },
  empty: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  createComboLink: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  createComboLinkText: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    textAlign: 'center',
  },
});
