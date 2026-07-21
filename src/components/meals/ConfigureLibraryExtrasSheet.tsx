import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  findNodeHandle,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type TextInput as TextInputType,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { FoodCategoryResponse, FoodItemResponse, FoodType, UUID } from '../../api/types';
import { ApiError } from '../../api/types';
import { ListSearchBar } from '../ui/ListSearchBar';
import { FoodTypePicker } from '../ui/FoodTypePicker';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import {
  getEffectivePriceDraft,
  hasComboPrice,
  parsePriceInput,
  validatePriceInput,
} from '../../utils/comboPrice';
import {
  comboPriceDraftErrorMessage,
  type ComboPriceDraftError,
} from '../../utils/comboSelectionPricing';
import { persistItemPriceDraft } from '../../utils/itemSelectionPricing';
import { CategoryChipRail } from './library/CategoryChipRail';
import { InlineChipEditor } from './library/InlineChipEditor';
import { MenuChip } from './library/MenuChip';
import { MenuPlanningBottomSheet, SheetPrimaryButton } from './MenuPlanningBottomSheet';

const MAX_ITEM_NAME_LENGTH = 80;

type ConfigureLibraryExtrasSheetProps = {
  visible: boolean;
  spaceId: UUID;
  items: FoodItemResponse[];
  categories: FoodCategoryResponse[];
  onClose: () => void;
  /** Patch a single catalog item in parent cache (preferred over full reload). */
  onItemUpdated: (item: FoodItemResponse) => void;
};

type ExtraGroup = {
  categoryId: string;
  categoryName: string;
  items: FoodItemResponse[];
};

function buildDraftExtra(items: FoodItemResponse[]): Record<string, boolean> {
  const next: Record<string, boolean> = {};
  for (const item of items) {
    if (item.isActive) {
      next[item.itemId] = item.isExtra === true;
    }
  }
  return next;
}

function buildDraftPrices(items: FoodItemResponse[]): Record<string, string> {
  const next: Record<string, string> = {};
  for (const item of items) {
    if (item.isActive && hasComboPrice(item.defaultPrice)) {
      next[item.itemId] = String(item.defaultPrice);
    }
  }
  return next;
}

function priceErrorForDraft(
  draft: string,
  requirePrice: boolean,
): ComboPriceDraftError | null {
  const trimmed = draft.trim();
  if (!trimmed) {
    return requirePrice ? 'required' : null;
  }
  const validation = validatePriceInput(trimmed);
  if (validation === 'invalid' || validation === 'nonPositive') {
    return validation;
  }
  return null;
}

/** Mess Menu Library: mark existing catalog items as reusable extras. */
export function ConfigureLibraryExtrasSheet({
  visible,
  spaceId,
  items,
  categories,
  onClose,
  onItemUpdated,
}: ConfigureLibraryExtrasSheetProps) {
  const { t } = useTranslation();
  const showToast = useToastStore(state => state.showToast);

  const [localItems, setLocalItems] = useState<FoodItemResponse[]>(items);
  const [draftExtra, setDraftExtra] = useState<Record<string, boolean>>({});
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [priceErrors, setPriceErrors] = useState<Record<string, ComboPriceDraftError>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [addingCategoryId, setAddingCategoryId] = useState<string | null>(null);
  const [draftFoodType, setDraftFoodType] = useState<FoodType>('VEG');
  const [busy, setBusy] = useState(false);
  const [focusPriceItemId, setFocusPriceItemId] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const priceInputRefs = useRef<Record<string, TextInputType | null>>({});
  const saveInFlightRef = useRef(false);
  const wasVisibleRef = useRef(false);
  const draftPricesRef = useRef(draftPrices);
  const localItemsRef = useRef(localItems);
  const draftExtraRef = useRef(draftExtra);

  draftPricesRef.current = draftPrices;
  localItemsRef.current = localItems;
  draftExtraRef.current = draftExtra;

  const applyItemUpdate = useCallback(
    (item: FoodItemResponse) => {
      setLocalItems(prev => {
        const index = prev.findIndex(row => row.itemId === item.itemId);
        if (index < 0) {
          return [...prev, item];
        }
        const next = [...prev];
        next[index] = item;
        return next;
      });
      onItemUpdated(item);
    },
    [onItemUpdated],
  );

  const runExclusive = useCallback(async (task: () => Promise<void>) => {
    if (saveInFlightRef.current) {
      return;
    }
    saveInFlightRef.current = true;
    setBusy(true);
    try {
      await task();
    } finally {
      saveInFlightRef.current = false;
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      setLocalItems(items);
      const nextExtra = buildDraftExtra(items);
      const nextPrices = buildDraftPrices(items);
      setDraftExtra(nextExtra);
      setDraftPrices(nextPrices);
      const nextErrors: Record<string, ComboPriceDraftError> = {};
      for (const item of items) {
        if (!item.isActive || nextExtra[item.itemId] !== true) {
          continue;
        }
        const draft = getEffectivePriceDraft(
          item.itemId,
          nextPrices,
          item.defaultPrice ?? null,
        );
        const error = priceErrorForDraft(draft, true);
        if (error) {
          nextErrors[item.itemId] = error;
        }
      }
      setPriceErrors(nextErrors);
      setSearchQuery('');
      setFilterCategoryId(null);
      setAddingCategoryId(null);
      setDraftFoodType('VEG');
      setFocusPriceItemId(null);
    }
    if (!visible) {
      setFocusPriceItemId(null);
      setBusy(false);
      saveInFlightRef.current = false;
    }
    wasVisibleRef.current = visible;
  }, [items, visible]);

  useEffect(() => {
    if (!focusPriceItemId) {
      return;
    }
    const timer = setTimeout(() => {
      const input = priceInputRefs.current[focusPriceItemId];
      const scroll = scrollRef.current;
      input?.focus();
      if (!input || !scroll) {
        return;
      }
      const scrollNode = findNodeHandle(scroll);
      if (!scrollNode) {
        return;
      }
      input.measureLayout(
        scrollNode,
        (_x, y) => {
          scroll.scrollTo({ y: Math.max(y - 48, 0), animated: true });
        },
        () => undefined,
      );
    }, 120);
    return () => clearTimeout(timer);
  }, [focusPriceItemId]);

  const activeCategories = useMemo(
    () => categories.filter(category => category.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return localItems.filter(item => {
      if (!item.isActive) {
        return false;
      }
      if (filterCategoryId && item.categoryId !== filterCategoryId) {
        return false;
      }
      if (!query) {
        return true;
      }
      const name = item.name.toLowerCase();
      const categoryName = (item.categoryName ?? '').toLowerCase();
      return name.includes(query) || categoryName.includes(query);
    });
  }, [filterCategoryId, localItems, searchQuery]);

  const groups = useMemo((): ExtraGroup[] => {
    const byCategory = new Map<string, ExtraGroup>();
    for (const item of filteredItems) {
      const categoryId = item.categoryId;
      const existing = byCategory.get(categoryId);
      if (existing) {
        existing.items.push(item);
      } else {
        byCategory.set(categoryId, {
          categoryId,
          categoryName: item.categoryName?.trim() || t('meals.library.uncategorized'),
          items: [item],
        });
      }
    }
    return Array.from(byCategory.values())
      .map(group => ({
        ...group,
        items: [...group.items].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [filteredItems, t]);

  const visiblePriceItemIds = useMemo(
    () => groups.flatMap(group => group.items.map(item => item.itemId)),
    [groups],
  );

  const hasValidationErrors = useMemo(() => {
    for (const item of localItems) {
      if (!item.isActive) {
        continue;
      }
      const enabled = draftExtra[item.itemId] === true;
      if (!enabled) {
        continue;
      }
      const draft = getEffectivePriceDraft(
        item.itemId,
        draftPrices,
        item.defaultPrice ?? null,
      );
      if (priceErrorForDraft(draft, true)) {
        return true;
      }
    }
    return Object.keys(priceErrors).length > 0;
  }, [draftExtra, draftPrices, localItems, priceErrors]);

  const hasUnsavedPriceEdits = useCallback(() => {
    for (const item of localItemsRef.current) {
      if (!item.isActive) {
        continue;
      }
      const draft = (draftPricesRef.current[item.itemId] ?? '').trim();
      const saved = hasComboPrice(item.defaultPrice) ? String(item.defaultPrice) : '';
      if (draft !== saved) {
        const enabled = draftExtraRef.current[item.itemId] === true;
        if (enabled || draft.length > 0) {
          return true;
        }
      }
    }
    return false;
  }, []);

  const revalidateEnabledPrices = useCallback(() => {
    const nextErrors: Record<string, ComboPriceDraftError> = {};
    let firstInvalidId: string | null = null;
    for (const item of localItemsRef.current) {
      if (!item.isActive || draftExtraRef.current[item.itemId] !== true) {
        continue;
      }
      const draft = getEffectivePriceDraft(
        item.itemId,
        draftPricesRef.current,
        item.defaultPrice ?? null,
      );
      const error = priceErrorForDraft(draft, true);
      if (error) {
        nextErrors[item.itemId] = error;
        if (!firstInvalidId) {
          firstInvalidId = item.itemId;
        }
      }
    }
    setPriceErrors(nextErrors);
    return firstInvalidId;
  }, []);

  const persistPrice = useCallback(
    async (item: FoodItemResponse, draftValue: string, options?: { requirePrice?: boolean }) => {
      const requirePrice =
        options?.requirePrice ?? draftExtraRef.current[item.itemId] === true;
      const normalizedDraft = draftValue.trim();
      setDraftPrices(prev => ({ ...prev, [item.itemId]: normalizedDraft }));

      const error = priceErrorForDraft(normalizedDraft, requirePrice);
      if (error) {
        setPriceErrors(prev => ({ ...prev, [item.itemId]: error }));
        return { ok: false as const, error };
      }

      setPriceErrors(prev => {
        if (!prev[item.itemId]) {
          return prev;
        }
        const next = { ...prev };
        delete next[item.itemId];
        return next;
      });

      if (!normalizedDraft) {
        return { ok: true as const, item };
      }

      const parsedPrice = parsePriceInput(normalizedDraft);
      if (
        parsedPrice != null &&
        hasComboPrice(item.defaultPrice) &&
        Number(item.defaultPrice) === parsedPrice
      ) {
        return { ok: true as const, item };
      }

      let updatedItem = item;
      let saveError: ComboPriceDraftError | undefined;
      await runExclusive(async () => {
        const draftsForSave = {
          ...draftPricesRef.current,
          [item.itemId]: normalizedDraft,
        };
        const { item: updated, error: persistError } = await persistItemPriceDraft(
          spaceId,
          item,
          draftsForSave,
          { requirePrices: requirePrice },
        );
        if (persistError) {
          saveError = persistError;
          setPriceErrors(prev => ({ ...prev, [item.itemId]: persistError }));
          if (persistError === 'invalid') {
            showToast(t('meals.errors.saveFailed'));
          }
          return;
        }
        updatedItem = updated;
        setDraftPrices(prev => ({
          ...prev,
          [item.itemId]: hasComboPrice(updated.defaultPrice)
            ? String(updated.defaultPrice)
            : normalizedDraft,
        }));
        applyItemUpdate(updated);
      });

      if (saveError) {
        return { ok: false as const, error: saveError };
      }
      return { ok: true as const, item: updatedItem };
    },
    [applyItemUpdate, runExclusive, showToast, spaceId, t],
  );

  const toggle = useCallback(
    async (item: FoodItemResponse, next: boolean) => {
      if (busy || saveInFlightRef.current) {
        return;
      }
      setDraftExtra(prev => ({ ...prev, [item.itemId]: next }));
      await runExclusive(async () => {
        try {
          const updated = await mealsApi.updateFoodItemExtra(spaceId, item.itemId, {
            isExtra: next,
          });
          applyItemUpdate(updated);
          setDraftExtra(prev => ({ ...prev, [updated.itemId]: updated.isExtra === true }));
          if (next) {
            const draft = getEffectivePriceDraft(
              updated.itemId,
              draftPricesRef.current,
              updated.defaultPrice ?? null,
            );
            const error = priceErrorForDraft(draft, true);
            if (error) {
              setPriceErrors(prev => ({ ...prev, [updated.itemId]: error }));
            }
            setFocusPriceItemId(updated.itemId);
          } else {
            setPriceErrors(prev => {
              if (!prev[item.itemId]) {
                return prev;
              }
              const cleared = { ...prev };
              delete cleared[item.itemId];
              return cleared;
            });
            if (focusPriceItemId === item.itemId) {
              setFocusPriceItemId(null);
            }
          }
        } catch {
          setDraftExtra(prev => ({ ...prev, [item.itemId]: item.isExtra === true }));
          showToast(t('meals.errors.actionFailed'));
        }
      });
    },
    [applyItemUpdate, busy, focusPriceItemId, runExclusive, showToast, spaceId, t],
  );

  const onPriceChange = useCallback(
    (itemId: string, text: string) => {
      const sanitized = text.replace(/[^\d.]/g, '');
      const parts = sanitized.split('.');
      const normalized =
        parts.length <= 2 ? sanitized : `${parts[0]}.${parts.slice(1).join('')}`;
      setDraftPrices(prev => ({ ...prev, [itemId]: normalized }));
      const enabled = draftExtraRef.current[itemId] === true;
      const error = priceErrorForDraft(normalized, enabled);
      setPriceErrors(prev => {
        if (!error) {
          if (!prev[itemId]) {
            return prev;
          }
          const next = { ...prev };
          delete next[itemId];
          return next;
        }
        return { ...prev, [itemId]: error };
      });
    },
    [],
  );

  const focusNextPrice = useCallback(
    (currentItemId: string) => {
      const index = visiblePriceItemIds.indexOf(currentItemId);
      if (index < 0 || index >= visiblePriceItemIds.length - 1) {
        Keyboard.dismiss();
        setFocusPriceItemId(null);
        return;
      }
      setFocusPriceItemId(visiblePriceItemIds[index + 1]);
    },
    [visiblePriceItemIds],
  );

  const saveNewItem = useCallback(
    async (categoryId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }
      if (trimmed.length > MAX_ITEM_NAME_LENGTH) {
        showToast(t('meals.library.itemNameTooLong'));
        return;
      }
      const duplicate = localItemsRef.current.some(
        item =>
          item.isActive &&
          item.categoryId === categoryId &&
          item.name.trim().toLowerCase() === trimmed.toLowerCase(),
      );
      if (duplicate) {
        showToast(t('meals.library.itemNameDuplicate'));
        return;
      }

      await runExclusive(async () => {
        try {
          const created = await mealsApi.createFoodItem(spaceId, {
            categoryId,
            name: trimmed,
            foodType: draftFoodType,
            isExtra: true,
          });
          applyItemUpdate(created);
          setDraftExtra(prev => ({ ...prev, [created.itemId]: true }));
          if (hasComboPrice(created.defaultPrice)) {
            setDraftPrices(prev => ({
              ...prev,
              [created.itemId]: String(created.defaultPrice),
            }));
          } else {
            setPriceErrors(prev => ({ ...prev, [created.itemId]: 'required' }));
          }
          setAddingCategoryId(null);
          setDraftFoodType('VEG');
          showToast(t('meals.library.extraCreateSuccess'));
          setFocusPriceItemId(created.itemId);
        } catch (error) {
          const message =
            error instanceof ApiError && /exist|duplicate/i.test(error.message)
              ? t('meals.library.itemNameDuplicate')
              : t('meals.errors.actionFailed');
          showToast(message);
        }
      });
    },
    [applyItemUpdate, draftFoodType, runExclusive, showToast, spaceId, t],
  );

  const bulkSetExtras = useCallback(
    async (enabled: boolean) => {
      const targets = localItemsRef.current.filter(
        item => item.isActive && (item.isExtra === true) !== enabled,
      );
      if (targets.length === 0) {
        return;
      }
      await runExclusive(async () => {
        try {
          for (const item of targets) {
            const updated = await mealsApi.updateFoodItemExtra(spaceId, item.itemId, {
              isExtra: enabled,
            });
            applyItemUpdate(updated);
            setDraftExtra(prev => ({ ...prev, [updated.itemId]: enabled }));
          }
          if (enabled) {
            revalidateEnabledPrices();
          } else {
            setPriceErrors({});
          }
          showToast(t('meals.library.extrasUpdated'));
        } catch {
          showToast(t('meals.errors.actionFailed'));
        }
      });
    },
    [applyItemUpdate, revalidateEnabledPrices, runExclusive, showToast, spaceId, t],
  );

  const openOverflowMenu = useCallback(() => {
    if (busy) {
      return;
    }
    Alert.alert(t('meals.library.configureExtrasActions'), undefined, [
      {
        text: t('meals.library.enableAllExtras'),
        onPress: () => void bulkSetExtras(true),
      },
      {
        text: t('meals.library.disableAllExtras'),
        style: 'destructive',
        onPress: () => void bulkSetExtras(false),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }, [bulkSetExtras, busy, t]);

  const flushUnsavedPrices = useCallback(async () => {
    const pending: Array<{ item: FoodItemResponse; draft: string }> = [];
    for (const item of localItemsRef.current) {
      if (!item.isActive) {
        continue;
      }
      const draft = (draftPricesRef.current[item.itemId] ?? '').trim();
      const saved = hasComboPrice(item.defaultPrice) ? String(item.defaultPrice) : '';
      if (draft === saved) {
        continue;
      }
      const enabled = draftExtraRef.current[item.itemId] === true;
      if (!enabled && !draft) {
        continue;
      }
      pending.push({ item, draft });
    }
    for (const entry of pending) {
      const result = await persistPrice(entry.item, entry.draft, {
        requirePrice: draftExtraRef.current[entry.item.itemId] === true,
      });
      if (!result.ok) {
        return false;
      }
    }
    return true;
  }, [persistPrice]);

  const requestClose = useCallback(() => {
    if (busy) {
      return;
    }
    Keyboard.dismiss();
    const firstInvalid = revalidateEnabledPrices();
    if (firstInvalid) {
      setFocusPriceItemId(firstInvalid);
      showToast(t('meals.pricing.fixFieldsBeforeSave'));
      return;
    }
    if (!hasUnsavedPriceEdits()) {
      onClose();
      return;
    }
    Alert.alert(
      t('meals.library.unsavedExtrasTitle'),
      t('meals.library.unsavedExtrasBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('meals.library.discardChanges'),
          style: 'destructive',
          onPress: onClose,
        },
        {
          text: t('common.save'),
          onPress: () => {
            void (async () => {
              const ok = await flushUnsavedPrices();
              if (ok) {
                onClose();
              } else {
                const invalidId = revalidateEnabledPrices();
                if (invalidId) {
                  setFocusPriceItemId(invalidId);
                }
              }
            })();
          },
        },
      ],
    );
  }, [
    busy,
    flushUnsavedPrices,
    hasUnsavedPriceEdits,
    onClose,
    revalidateEnabledPrices,
    showToast,
    t,
  ]);

  const handleDone = useCallback(() => {
    if (busy) {
      return;
    }
    Keyboard.dismiss();
    const firstInvalid = revalidateEnabledPrices();
    if (firstInvalid) {
      setFocusPriceItemId(firstInvalid);
      showToast(t('meals.pricing.fixFieldsBeforeSave'));
      return;
    }
    void (async () => {
      const hadEdits = hasUnsavedPriceEdits();
      const ok = await flushUnsavedPrices();
      if (!ok) {
        const invalidId = revalidateEnabledPrices();
        if (invalidId) {
          setFocusPriceItemId(invalidId);
        }
        return;
      }
      if (hadEdits) {
        showToast(t('meals.library.extrasUpdated'));
      }
      onClose();
    })();
  }, [
    busy,
    flushUnsavedPrices,
    hasUnsavedPriceEdits,
    onClose,
    revalidateEnabledPrices,
    showToast,
    t,
  ]);

  const stickyHeader = (
    <View style={styles.stickyBlock}>
      <View style={styles.searchWrap}>
        <ListSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('meals.library.searchExtrasPlaceholder')}
        />
      </View>
      <CategoryChipRail
        categories={activeCategories}
        selectedCategoryId={filterCategoryId}
        includeAll
        onSelectAll={() => setFilterCategoryId(null)}
        onSelect={setFilterCategoryId}
      />
    </View>
  );

  return (
    <MenuPlanningBottomSheet
      visible={visible}
      title={t('meals.library.configureExtrasTitle')}
      onClose={requestClose}
      busy={busy}
      scrollViewRef={scrollRef}
      stickyHeader={stickyHeader}
      minHeightRatio={0.55}
      maxHeightRatio={0.92}
      headerActions={
        <Pressable
          onPress={openOverflowMenu}
          hitSlop={12}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={t('meals.library.configureExtrasActions')}
          style={styles.overflowBtn}>
          <Text style={[styles.overflowBtnText, busy && styles.disabledText]}>⋮</Text>
        </Pressable>
      }
      footer={
        <SheetPrimaryButton
          label={t('common.done')}
          onPress={handleDone}
          disabled={busy || hasValidationErrors}
        />
      }>
      <Text style={styles.hint}>{t('meals.library.configureExtrasHint')}</Text>
      {groups.length === 0 ? (
        <Text style={styles.empty}>
          {searchQuery.trim() || filterCategoryId
            ? t('meals.library.searchExtrasEmpty')
            : t('meals.library.itemsEmpty')}
        </Text>
      ) : (
        groups.map(group => (
          <View key={group.categoryId} style={styles.group}>
            <Text style={styles.groupTitle}>{group.categoryName}</Text>
            {group.items.map(item => {
              const selected = draftExtra[item.itemId] === true;
              const priceDraft = getEffectivePriceDraft(
                item.itemId,
                draftPrices,
                item.defaultPrice ?? null,
              );
              const errorKey = priceErrors[item.itemId];
              const isLastVisible =
                visiblePriceItemIds[visiblePriceItemIds.length - 1] === item.itemId;
              return (
                <View
                  key={item.itemId}
                  style={[styles.row, selected && styles.rowSelected]}>
                  <Pressable
                    style={styles.rowToggle}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel={item.name}
                    onPress={() => void toggle(item, !selected)}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </Pressable>
                  <View style={styles.inlinePriceBlock}>
                    <View
                      style={[
                        styles.inlinePriceRow,
                        errorKey ? styles.priceInputRowError : null,
                      ]}>
                      <Text style={styles.inlineCurrency}>₹</Text>
                      <TextInput
                        ref={ref => {
                          priceInputRefs.current[item.itemId] = ref;
                        }}
                        style={styles.inlinePriceInput}
                        value={priceDraft}
                        onChangeText={text => onPriceChange(item.itemId, text)}
                        onFocus={() => setFocusPriceItemId(item.itemId)}
                        onBlur={() => {
                          const draft =
                            draftPricesRef.current[item.itemId] ?? priceDraft;
                          const enabled = draftExtraRef.current[item.itemId] === true;
                          const error = priceErrorForDraft(draft, enabled);
                          setPriceErrors(prev => {
                            if (!error) {
                              if (!prev[item.itemId]) {
                                return prev;
                              }
                              const next = { ...prev };
                              delete next[item.itemId];
                              return next;
                            }
                            return { ...prev, [item.itemId]: error };
                          });
                        }}
                        onEndEditing={event =>
                          void persistPrice(item, event.nativeEvent.text)
                        }
                        onSubmitEditing={() => {
                          void (async () => {
                            await persistPrice(
                              item,
                              draftPricesRef.current[item.itemId] ?? priceDraft,
                            );
                            if (isLastVisible) {
                              Keyboard.dismiss();
                              setFocusPriceItemId(null);
                            } else {
                              focusNextPrice(item.itemId);
                            }
                          })();
                        }}
                        blurOnSubmit={false}
                        returnKeyType={isLastVisible ? 'done' : 'next'}
                        keyboardType="decimal-pad"
                        placeholder={t('meals.pricing.pricePlaceholder')}
                        placeholderTextColor={colors.muted}
                        editable={!busy}
                        selectTextOnFocus
                        accessibilityLabel={`${item.name} ${t('meals.pricing.enterPrice')}`}
                      />
                    </View>
                    {errorKey ? (
                      <Text style={styles.inlinePriceError} numberOfLines={2}>
                        {comboPriceDraftErrorMessage(errorKey, t)}
                      </Text>
                    ) : null}
                  </View>
                  <Switch
                    value={selected}
                    disabled={busy}
                    onValueChange={value => void toggle(item, value)}
                    trackColor={{ true: colors.primary, false: colors.border }}
                    thumbColor={colors.white}
                    accessibilityLabel={t('meals.library.toggleExtraA11y', {
                      name: item.name,
                    })}
                  />
                </View>
              );
            })}

            {addingCategoryId !== group.categoryId ? (
              <View style={styles.addItemRow}>
                <MenuChip
                  label={t('meals.library.chipAddItem')}
                  variant="add"
                  onPress={
                    busy
                      ? undefined
                      : () => {
                          setAddingCategoryId(group.categoryId);
                          setDraftFoodType('VEG');
                        }
                  }
                />
              </View>
            ) : (
              <View style={styles.editorRow}>
                <InlineChipEditor
                  placeholder={t('meals.library.itemNameInlinePlaceholder')}
                  onSave={name => saveNewItem(group.categoryId, name)}
                  onCancel={() => {
                    setAddingCategoryId(null);
                    setDraftFoodType('VEG');
                  }}
                  layout="full"
                  maxLength={MAX_ITEM_NAME_LENGTH}
                />
                <FoodTypePicker value={draftFoodType} onChange={setDraftFoodType} compact />
              </View>
            )}
          </View>
        ))
      )}
    </MenuPlanningBottomSheet>
  );
}

const styles = StyleSheet.create({
  stickyBlock: {
    gap: spacing.sm,
  },
  searchWrap: {
    marginBottom: spacing.xxs,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  empty: { ...typography.body, color: colors.muted },
  group: { marginBottom: spacing.md },
  groupTitle: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  rowToggle: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 2,
  },
  name: { ...typography.bodyStrong },
  inlinePriceBlock: {
    flexShrink: 0,
    alignItems: 'flex-end',
    maxWidth: 110,
  },
  inlinePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.white,
  },
  priceInputRowError: {
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
  },
  inlineCurrency: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  inlinePriceInput: {
    width: 56,
    ...typography.bodyStrong,
    fontSize: 14,
    paddingVertical: 4,
    color: colors.textPrimary,
  },
  inlinePriceError: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: 2,
    textAlign: 'right',
    alignSelf: 'stretch',
  },
  addItemRow: {
    marginTop: spacing.xxs,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  editorRow: {
    width: '100%',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    backgroundColor: colors.white,
  },
  overflowBtn: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowBtnText: {
    ...typography.bodyStrong,
    fontSize: 20,
    color: colors.muted,
    lineHeight: 22,
  },
  disabledText: { opacity: 0.4 },
});
