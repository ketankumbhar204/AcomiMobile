import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
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
import type { FoodItemResponse, MealType, MealComboResponse, UUID } from '../../api/types';
import {
  MenuSelectionPanel,
  type MenuSelectionPanelHandle,
  type MenuSelectionSaveResult,
} from '../../components/meals/MenuSelectionPanel';
import { MealExtrasEnableSection } from '../../components/meals/MealExtrasEnableSection';
import { MealStatusBadge } from '../../components/meals/MealStatusBadge';
import { Button, HeaderBackButton, PermissionDeniedScreen } from '../../components/ui';
import { useMealPricingPolicy } from '../../hooks/useMealPricingPolicy';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { addDaysIsoDate, formatMenuDate, isPastMenuDate } from '../../utils/mealDates';
import { fetchSpaceMenuCatalog, patchSpaceMenuCatalogItem } from '../../utils/fetchSpaceMenuCatalog';
import {
  loadMenuDraft,
  mergeSelectionIntoOptions,
  optionChipId,
  saveMenuDraft,
  toMenuDraftOption,
  type MenuDraftOption,
  type MenuSelectionItemPackage,
} from '../../utils/dailyMenuDraft';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import {
  comboPriceDraftFromOption,
  getEffectivePriceDraft,
  parsePriceInput,
  resolveMenuOptionPrice,
  validatePriceInput,
} from '../../utils/comboPrice';
import {
  applyDraftPricesToCombos,
  type ComboPriceDraftErrors,
} from '../../utils/comboSelectionPricing';
import { countPlannedEntries, getPlannedEntryKind, plannedSummaryI18nKey } from '../../utils/plannedMenuSummary';
import { collectSelectedMealItemIds } from '../../utils/mealExtrasSuggestions';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type DailyMenuEditScreenProps = {
  spaceId: UUID;
  menuDate: string;
  mealType: MealType;
};

type DraftSnapshot = {
  optionsKey: string;
  notes: string;
  pricesKey: string;
};

function snapshotDraft(
  nextOptions: MenuDraftOption[],
  nextNotes: string,
  nextPrices: Record<string, string>,
): DraftSnapshot {
  return {
    optionsKey: JSON.stringify(
      nextOptions.map(option => ({
        entryType: option.entryType,
        comboId: option.comboId ?? null,
        itemId: option.itemId ?? null,
        itemIds: option.itemIds ?? null,
        label: option.label,
        sortOrder: option.sortOrder,
        price: option.price ?? null,
        isAvailable: option.isAvailable,
        isExtra: option.isExtra === true,
      })),
    ),
    notes: nextNotes.trim(),
    pricesKey: JSON.stringify(
      Object.keys(nextPrices)
        .sort()
        .map(key => [key, nextPrices[key]]),
    ),
  };
}

export function DailyMenuEditScreen({ spaceId, menuDate, mealType }: DailyMenuEditScreenProps) {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const permissions = useSpacePermissions(spaceId);
  const mealPricing = useMealPricingPolicy(spaceId);
  const showToast = useToastStore(state => state.showToast);
  const dateReadOnly = isPastMenuDate(menuDate);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<MenuDraftOption[]>([]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'MODIFIED'>('DRAFT');
  const [comboById, setComboById] = useState<Map<string, MealComboResponse>>(new Map());
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [priceErrors, setPriceErrors] = useState<ComboPriceDraftErrors>({});
  const [panelSeedKey, setPanelSeedKey] = useState(0);
  const [panelHasSelection, setPanelHasSelection] = useState(false);
  const [catalogItems, setCatalogItems] = useState<FoodItemResponse[]>([]);
  const latestSelectionRef = useRef<MenuSelectionSaveResult | null>(null);
  const baselineRef = useRef<DraftSnapshot | null>(null);
  const allowLeaveRef = useRef(false);
  const panelRef = useRef<MenuSelectionPanelHandle>(null);
  const scrollRef = useRef<ScrollView>(null);

  const isDirty = useMemo(() => {
    if (loading || dateReadOnly || baselineRef.current == null) {
      return false;
    }
    const current = snapshotDraft(options, notes, priceDrafts);
    const baseline = baselineRef.current;
    return (
      baseline.optionsKey !== current.optionsKey ||
      baseline.notes !== current.notes ||
      baseline.pricesKey !== current.pricesKey
    );
  }, [dateReadOnly, loading, notes, options, priceDrafts]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('meals.planning.editTitle', { meal: t(mealTypeLabelKey(mealType)) }),
      headerBackVisible: false,
      headerLeft: () => <HeaderBackButton />,
    });
  }, [mealType, navigation, t]);

  useEffect(() => {
    setOptions([]);
    setNotes('');
    setStatus('DRAFT');
    setLoading(true);
    setPriceDrafts({});
    setPriceErrors({});
    baselineRef.current = null;
    allowLeaveRef.current = false;
  }, [mealType, menuDate, spaceId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          const [draft, catalog] = await Promise.all([
            loadMenuDraft(spaceId, menuDate, mealType),
            fetchSpaceMenuCatalog(spaceId).catch(() => null),
          ]);
          if (!active) {
            return;
          }
          const comboList = catalog?.combos ?? [];
          setComboById(new Map(comboList.map(combo => [combo.comboId, combo])));
          setCatalogItems(catalog?.items ?? []);
          const comboOptions = draft.options.filter(option => option.entryType !== 'ITEM');
          setOptions(comboOptions);
          setNotes(draft.notes);
          setStatus(draft.menu?.status ?? 'DRAFT');
          const comboMap = new Map(comboList.map(combo => [combo.comboId, combo]));
          const nextPrices = comboOptions.reduce<Record<string, string>>((acc, option) => {
            acc[optionChipId(option)] = comboPriceDraftFromOption(
              resolveMenuOptionPrice(option, comboMap),
            );
            return acc;
          }, {});
          setPriceDrafts(nextPrices);
          baselineRef.current = snapshotDraft(comboOptions, draft.notes ?? '', nextPrices);
          allowLeaveRef.current = false;
          setPanelSeedKey(key => key + 1);
        } catch {
          if (active) {
            showToast(t('meals.errors.loadFailed'));
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      })();
      return () => {
        active = false;
      };
    }, [mealType, menuDate, showToast, spaceId, t]),
  );

  const plannedCombos = useMemo(
    () => options.filter(option => option.entryType === 'COMBO' || option.entryType === 'PACKAGE'),
    [options],
  );

  const enabledExtras = useMemo((): MenuSelectionItemPackage[] => {
    return options
      .filter(
        option =>
          option.entryType === 'PACKAGE' &&
          option.isExtra === true &&
          (option.itemIds?.length ?? 0) === 1,
      )
      .map(option => ({
        itemId: option.itemIds![0],
        name: option.label,
        price: option.price ?? null,
        currencyCode: option.currencyCode ?? 'INR',
        foodType: option.foodType ?? null,
      }));
  }, [options]);

  const selectedMealItemIds = useMemo(
    () => collectSelectedMealItemIds(options, comboById),
    [comboById, options],
  );

  const patchCatalogItem = useCallback(
    (item: FoodItemResponse) => {
      patchSpaceMenuCatalogItem(spaceId, item);
      setCatalogItems(prev => {
        const index = prev.findIndex(row => row.itemId === item.itemId);
        if (index < 0) {
          return [...prev, item];
        }
        const next = [...prev];
        next[index] = item;
        return next;
      });
    },
    [spaceId],
  );

  const extrasFromOptions = useCallback((prev: MenuDraftOption[]): MenuSelectionItemPackage[] => {
    return prev
      .filter(
        option =>
          option.entryType === 'PACKAGE' &&
          option.isExtra === true &&
          (option.itemIds?.length ?? 0) === 1,
      )
      .map(option => ({
        itemId: option.itemIds![0],
        name: option.label,
        price: option.price ?? null,
        currencyCode: option.currencyCode ?? 'INR',
        foodType: option.foodType ?? null,
      }));
  }, []);

  const handleSelectCombos = useCallback((result: MenuSelectionSaveResult) => {
    latestSelectionRef.current = result;
    const { combos: savedCombos, itemPackages, adHocPackages } = result;

    setComboById(prev => {
      const next = new Map(prev);
      for (const combo of savedCombos) {
        next.set(combo.comboId, combo);
      }
      return next;
    });

    setOptions(prev => {
      const nextOptions = mergeSelectionIntoOptions(
        prev,
        savedCombos.map(combo => ({
          comboId: combo.comboId,
          name: combo.name,
          price: combo.price ?? null,
          currencyCode: combo.currencyCode ?? 'INR',
        })),
        itemPackages,
        adHocPackages,
        extrasFromOptions(prev),
      );

      setPriceDrafts(drafts => {
        const next = { ...drafts };
        for (const combo of savedCombos) {
          next[combo.comboId] = getEffectivePriceDraft(combo.comboId, drafts, combo.price);
        }
        for (const item of itemPackages) {
          next[item.itemId] = String(item.price);
        }
        for (const item of extrasFromOptions(prev)) {
          next[`extra:${item.itemId}`] =
            item.price != null ? String(item.price) : next[`extra:${item.itemId}`];
        }
        for (const option of nextOptions) {
          if (option.entryType === 'PACKAGE' && (option.itemIds?.length ?? 0) > 1) {
            const id = optionChipId(option);
            next[id] = getEffectivePriceDraft(id, drafts, option.price);
          }
        }
        for (const pkg of adHocPackages) {
          const id = optionChipId({
            entryType: 'PACKAGE',
            label: pkg.label,
            itemIds: pkg.itemIds,
            sortOrder: 0,
            isAvailable: true,
          });
          if (pkg.price != null && pkg.price > 0) {
            next[id] = String(pkg.price);
          }
        }
        return next;
      });

      return nextOptions;
    });

    setPriceErrors({});
  }, [extrasFromOptions]);

  const handleExtrasChange = useCallback(
    (extras: MenuSelectionItemPackage[]) => {
      setOptions(prev => {
        const selection = latestSelectionRef.current;
        const combos =
          selection?.combos.map(combo => ({
            comboId: combo.comboId,
            name: combo.name,
            price: combo.price ?? null,
            currencyCode: combo.currencyCode ?? 'INR',
          })) ??
          prev
            .filter(option => option.entryType === 'COMBO' && option.comboId)
            .map(option => ({
              comboId: option.comboId as string,
              name: option.label,
              price: option.price ?? null,
              currencyCode: option.currencyCode ?? 'INR',
            }));
        const itemPackages =
          selection?.itemPackages ??
          prev
            .filter(
              option =>
                option.entryType === 'PACKAGE' &&
                option.isExtra !== true &&
                (option.itemIds?.length ?? 0) === 1,
            )
            .map(option => ({
              itemId: option.itemIds![0],
              name: option.label,
              price: option.price ?? null,
              currencyCode: option.currencyCode ?? 'INR',
              foodType: option.foodType ?? null,
            }));
        const adHocPackages =
          selection?.adHocPackages ??
          prev
            .filter(
              option =>
                option.entryType === 'PACKAGE' &&
                option.isExtra !== true &&
                (option.itemIds?.length ?? 0) > 1,
            )
            .map(option => ({
              label: option.label,
              itemIds: option.itemIds ?? [],
              price: option.price ?? null,
              currencyCode: option.currencyCode ?? 'INR',
            }));

        const nextOptions = mergeSelectionIntoOptions(
          prev,
          combos,
          itemPackages,
          adHocPackages,
          extras,
        );

        setPriceDrafts(drafts => {
          const next = { ...drafts };
          for (const item of extras) {
            if (item.price != null) {
              next[`extra:${item.itemId}`] = String(item.price);
            }
          }
          return next;
        });

        if (latestSelectionRef.current) {
          latestSelectionRef.current = {
            ...latestSelectionRef.current,
            extraPackages: extras,
          };
        }

        return nextOptions;
      });
    },
    [],
  );

  const copyFromYesterday = async () => {
    const sourceDate = addDaysIsoDate(menuDate, -1);
    setSaving(true);
    try {
      const copied = await mealsApi.copyDailyMenu(spaceId, menuDate, mealType, sourceDate);
      const copiedCombos = copied.options
        .map(toMenuDraftOption)
        .filter(option => option.entryType !== 'ITEM');
      const nextNotes = copied.notes ?? '';
      const nextPrices = copiedCombos.reduce<Record<string, string>>((acc, option) => {
        acc[optionChipId(option)] = comboPriceDraftFromOption(
          resolveMenuOptionPrice(option, comboById),
        );
        return acc;
      }, {});
      setOptions(copiedCombos);
      setNotes(nextNotes);
      setStatus(copied.status);
      setPriceDrafts(nextPrices);
      baselineRef.current = snapshotDraft(copiedCombos, nextNotes, nextPrices);
      allowLeaveRef.current = false;
      setPanelSeedKey(key => key + 1);
      showToast(t('meals.planning.copySuccess'));
    } catch {
      showToast(t('meals.planning.copyFailed'));
    } finally {
      setSaving(false);
    }
  };

  const buildOptionsFromLatestSelection = useCallback(
    (base: MenuDraftOption[]): MenuDraftOption[] => {
      const selection = latestSelectionRef.current;
      if (!selection) {
        return base;
      }
      return mergeSelectionIntoOptions(
        base,
        selection.combos.map(combo => ({
          comboId: combo.comboId,
          name: combo.name,
          price: combo.price ?? null,
          currencyCode: combo.currencyCode ?? 'INR',
        })),
        selection.itemPackages,
        selection.adHocPackages,
        extrasFromOptions(base),
      );
    },
    [extrasFromOptions],
  );

  const resolveOptionsForSave = useCallback((): MenuDraftOption[] => {
    return buildOptionsFromLatestSelection(options);
  }, [buildOptionsFromLatestSelection, options]);

  const syncPricesBeforeSave = async (
    optionsToSync: MenuDraftOption[],
    toastKey: 'meals.pricing.fixFieldsBeforeSave' | 'meals.pricing.fixFieldsBeforeShare',
    panelDraftPrices?: Record<string, string>,
  ): Promise<boolean> => {
    if (!mealPricing.requiresMealPrices) {
      return true;
    }

    const draftsForSave = {
      ...priceDrafts,
      ...(panelDraftPrices ?? {}),
    };
    if (panelDraftPrices) {
      setPriceDrafts(draftsForSave);
    }

    const planned = optionsToSync.filter(
      option => option.entryType === 'COMBO' || option.entryType === 'PACKAGE',
    );
    const comboResponses = planned
      .filter(option => option.entryType === 'COMBO' && option.comboId)
      .map(option => comboById.get(option.comboId as string))
      .filter((combo): combo is MealComboResponse => combo != null);

    const packageErrors: ComboPriceDraftErrors = {};
    for (const option of planned.filter(row => row.entryType === 'PACKAGE')) {
      const id = optionChipId(option);
      const draft = getEffectivePriceDraft(id, draftsForSave, option.price);
      if (!draft.trim()) {
        packageErrors[id] = 'required';
        continue;
      }
      const validation = validatePriceInput(draft);
      if (validation) {
        packageErrors[id] = validation === 'nonPositive' ? 'nonPositive' : 'invalid';
      }
    }

    const { updatedCombos, errors: comboErrors } = await applyDraftPricesToCombos(
      spaceId,
      comboResponses,
      draftsForSave,
      { requirePrices: mealPricing.requiresMealPrices },
    );
    const mergedErrors = { ...comboErrors, ...packageErrors };
    if (Object.keys(mergedErrors).length > 0) {
      setPriceErrors(mergedErrors);
      panelRef.current?.validatePrices();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      showToast(t(toastKey));
      return false;
    }

    setComboById(prev => {
      const next = new Map(prev);
      for (const combo of updatedCombos) {
        next.set(combo.comboId, combo);
      }
      return next;
    });

    setOptions(prev => {
      const merged = buildOptionsFromLatestSelection(prev);
      return merged.map(option => {
        if (option.entryType !== 'PACKAGE') {
          return option;
        }
        const id = optionChipId(option);
        const draft = getEffectivePriceDraft(id, draftsForSave, option.price);
        const price = parsePriceInput(draft);
        if (price == null) {
          return option;
        }
        return { ...option, price, currencyCode: option.currencyCode ?? 'INR' };
      });
    });
    setPriceErrors({});
    return true;
  };

  const prepareOptionsForSave = (
    toastKey: 'meals.pricing.fixFieldsBeforeSave' | 'meals.pricing.fixFieldsBeforeShare',
  ): { options: MenuDraftOption[]; draftPrices: Record<string, string> } | null => {
    const panelDrafts = panelRef.current?.getDraftPrices() ?? {};

    if (mealPricing.requiresMealPrices) {
      if (!(panelRef.current?.validatePrices() ?? true)) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        showToast(t(toastKey));
        return null;
      }
      const selection = panelRef.current?.getSelectionResult();
      if (selection) {
        latestSelectionRef.current = selection;
        const mergedDrafts = { ...priceDrafts, ...panelDrafts };
        setPriceDrafts(mergedDrafts);
        const mergedOptions = mergeSelectionIntoOptions(
          options,
          selection.combos.map(combo => ({
            comboId: combo.comboId,
            name: combo.name,
            price: combo.price ?? null,
            currencyCode: combo.currencyCode ?? 'INR',
          })),
          selection.itemPackages,
          selection.adHocPackages,
          extrasFromOptions(options),
        );
        if (mergedOptions.length === 0) {
          showToast(t('meals.errors.optionsRequired'));
          return null;
        }
        return {
          options: mergedOptions,
          draftPrices: mergedDrafts,
        };
      }
    }

    const optionsToSave = resolveOptionsForSave();
    if (optionsToSave.length === 0) {
      if (panelRef.current?.hasSelection()) {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        showToast(t(toastKey));
        return null;
      }
      showToast(t('meals.errors.optionsRequired'));
      return null;
    }
    return {
      options: optionsToSave,
      draftPrices: { ...priceDrafts, ...panelDrafts },
    };
  };

  const buildOptionsForSave = (
    optionsToSave: MenuDraftOption[],
    draftsForSave: Record<string, string>,
  ): MenuDraftOption[] =>
    optionsToSave.map(option => {
      if (option.entryType !== 'PACKAGE') {
        return option;
      }
      const id = optionChipId(option);
      const draft = getEffectivePriceDraft(id, draftsForSave, option.price);
      const price = parsePriceInput(draft);
      if (price == null) {
        return option;
      }
      return { ...option, price, currencyCode: option.currencyCode ?? 'INR' };
    });

  const persist = async () => {
    const prepared = prepareOptionsForSave('meals.pricing.fixFieldsBeforeSave');
    if (!prepared || prepared.options.length === 0) {
      return;
    }
    setSaving(true);
    try {
      const pricesOk = await syncPricesBeforeSave(
        prepared.options,
        'meals.pricing.fixFieldsBeforeSave',
        prepared.draftPrices,
      );
      if (!pricesOk) {
        return;
      }
      const nextOptions = buildOptionsForSave(
        buildOptionsFromLatestSelection(prepared.options),
        prepared.draftPrices,
      );
      await saveMenuDraft(spaceId, menuDate, mealType, nextOptions, notes.trim() || null);
      showToast(t('meals.success.saved'));
      allowLeaveRef.current = true;
      navigation.goBack();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const shareMeal = async () => {
    const prepared = prepareOptionsForSave('meals.pricing.fixFieldsBeforeShare');
    if (!prepared || prepared.options.length === 0) {
      return;
    }
    setSaving(true);
    try {
      const pricesOk = await syncPricesBeforeSave(
        prepared.options,
        'meals.pricing.fixFieldsBeforeShare',
        prepared.draftPrices,
      );
      if (!pricesOk) {
        return;
      }
      const nextOptions = buildOptionsForSave(
        buildOptionsFromLatestSelection(prepared.options),
        prepared.draftPrices,
      );
      await saveMenuDraft(spaceId, menuDate, mealType, nextOptions, notes.trim() || null);
      allowLeaveRef.current = true;
      navigateMainStack('MenuSharePreview', { spaceId, menuDate, mealType });
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const clearDraft = async () => {
    if (status !== 'DRAFT') {
      return;
    }
    setSaving(true);
    try {
      await mealsApi.deleteDailyMenu(spaceId, menuDate, mealType);
      showToast(t('meals.success.draftDeleted'));
      allowLeaveRef.current = true;
      navigation.goBack();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const persistRef = useRef(persist);
  const shareMealRef = useRef(shareMeal);
  persistRef.current = persist;
  shareMealRef.current = shareMeal;

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (allowLeaveRef.current || dateReadOnly || !isDirty) {
        return;
      }
      event.preventDefault();
      Alert.alert(t('meals.menu.unsavedTitle'), t('meals.menu.unsavedMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('meals.actions.saveDraft'),
          onPress: () => {
            void persistRef.current();
          },
        },
        {
          text: t('meals.actions.shareMeal'),
          onPress: () => {
            void shareMealRef.current();
          },
        },
      ]);
    });
    return unsubscribe;
  }, [dateReadOnly, isDirty, navigation, t]);

  const plannedCounts = useMemo(() => countPlannedEntries(plannedCombos), [plannedCombos]);

  const summaryText =
    plannedCombos.length > 0
      ? t(plannedSummaryI18nKey(plannedCounts), { count: plannedCombos.length })
      : t('meals.menu.plannedSummaryEmpty');

  if (!permissions.canManageMeals) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={Keyboard.dismiss}>
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Text style={styles.date}>{formatMenuDate(menuDate, i18n.language)}</Text>
            <Text style={styles.summary}>{summaryText}</Text>
          </View>
          <View style={styles.metaRight}>
            {status === 'PUBLISHED' ? (
              <MealStatusBadge kind="shared" />
            ) : status === 'MODIFIED' ? (
              <MealStatusBadge kind="needs_reshare" />
            ) : (
              <MealStatusBadge kind="draft" />
            )}
          </View>
        </View>

        {dateReadOnly ? (
          <View style={styles.readOnlyBanner}>
            <Text style={styles.readOnlyBannerText}>{t('meals.planning.pastDateReadOnly')}</Text>
          </View>
        ) : null}

        {!dateReadOnly && !loading && plannedCombos.length === 0 ? (
          <Button
            label={t('meals.menu.copyYesterdayButton')}
            variant="secondary"
            loading={saving}
            onPress={() => void copyFromYesterday()}
            style={styles.copyButton}
          />
        ) : null}

        {!dateReadOnly && plannedCombos.length > 0 ? (
          <Pressable
            style={styles.previewLink}
            onPress={() =>
              navigateMainStack('MenuSharePreview', { spaceId, menuDate, mealType })
            }>
            <Text style={styles.previewLinkText}>{t('meals.planning.previewShare')}</Text>
          </Pressable>
        ) : null}

        {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {!loading ? (
          <>
            {!dateReadOnly ? (
              <>
                <MenuSelectionPanel
                  ref={panelRef}
                  key={`${menuDate}-${mealType}-${panelSeedKey}`}
                  spaceId={spaceId}
                  initialOptions={options}
                  onChange={handleSelectCombos}
                  requiresMealPrices={mealPricing.requiresMealPrices}
                  onSelectionPresenceChange={setPanelHasSelection}
                />
                {mealPricing.requiresMealPrices ? (
                  <MealExtrasEnableSection
                    spaceId={spaceId}
                    catalogItems={catalogItems}
                    selectedMealItemIds={selectedMealItemIds}
                    enabledExtras={enabledExtras}
                    onChange={handleExtrasChange}
                    onCatalogItemUpdated={patchCatalogItem}
                  />
                ) : null}
              </>
            ) : plannedCombos.length === 0 ? (
              <Text style={styles.emptySelection}>{t('meals.planning.noMenusSelectedYet')}</Text>
            ) : (
              plannedCombos.map(option => (
                <View key={optionChipId(option)} style={styles.readOnlyRow}>
                  <Text style={styles.readOnlyName} numberOfLines={1}>
                    {option.label}
                    {getPlannedEntryKind(option) === 'combo'
                      ? ` ${t('meals.menu.entryKindComboSuffix')}`
                      : ''}
                  </Text>
                  {mealPricing.showMealPrices ? (
                    <Text style={styles.readOnlyPrice}>
                      {resolveMenuOptionPrice(option, comboById) != null
                        ? `₹${resolveMenuOptionPrice(option, comboById)}`
                        : '—'}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </>
        ) : null}

        <Text style={styles.sectionLabel}>{t('meals.menu.notes')}</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          multiline
          editable={!dateReadOnly}
          placeholder={t('meals.menu.notesPlaceholder')}
        />
      </ScrollView>

      {!dateReadOnly ? (
        <View style={styles.stickyFooter}>
        {status === 'DRAFT' && options.length > 0 ? (
          <Pressable
            style={styles.deleteLink}
            disabled={saving}
            onPress={() => void clearDraft()}>
            <Text style={styles.deleteLinkText}>{t('meals.actions.deleteDraft')}</Text>
          </Pressable>
        ) : null}
        <View style={styles.footerActions}>
          <Button
            label={t('meals.actions.saveDraft')}
            variant="secondary"
            loading={saving}
            disabled={options.length === 0 && !panelHasSelection}
            onPress={() => void persist()}
            style={styles.footerButton}
          />
          <Button
            label={t('meals.actions.shareMeal')}
            loading={saving}
            disabled={options.length === 0 && !panelHasSelection}
            onPress={() => void shareMeal()}
            style={styles.footerButton}
          />
        </View>
      </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, paddingBottom: spacing.section },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metaLeft: { flex: 1, minWidth: 0 },
  metaRight: { alignItems: 'flex-end', flexShrink: 0 },
  date: { ...typography.bodyStrong, marginBottom: spacing.xxs },
  summary: { ...typography.caption, color: colors.textSecondary },
  published: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  modified: {
    ...typography.caption,
    color: '#C2410C',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  draft: {
    ...typography.caption,
    color: '#D97706',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  copyButton: { marginBottom: spacing.sm },
  readOnlyBanner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  readOnlyBannerText: { ...typography.caption, color: colors.muted, lineHeight: 18 },
  previewLink: { marginBottom: spacing.md },
  previewLinkText: { ...typography.body, color: colors.primaryDark, fontWeight: '600' },
  loader: { marginVertical: spacing.md },
  emptySelection: { ...typography.caption, color: colors.muted, marginBottom: spacing.sm },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  readOnlyName: { ...typography.bodyStrong, flex: 1, minWidth: 0 },
  readOnlyPrice: { ...typography.body, color: colors.textSecondary },
  sectionLabel: { ...typography.bodyStrong, marginTop: spacing.md, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    padding: spacing.md,
    backgroundColor: colors.white,
    ...typography.body,
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top', marginBottom: spacing.xl },
  stickyFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  deleteLink: { alignItems: 'center', paddingVertical: spacing.xs },
  deleteLinkText: { ...typography.caption, color: '#DC2626', fontWeight: '600' },
  footerActions: { flexDirection: 'row', gap: spacing.sm },
  footerButton: { flex: 1 },
});
