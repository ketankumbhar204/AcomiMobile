import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import type { MealType, MealComboResponse, UUID } from '../../api/types';
import { ComboItemsPopup } from '../../components/meals/ComboItemsPopup';
import { CreateComboSheet } from '../../components/meals/CreateComboSheet';
import {
  comboPriceDraftFromOption,
  PlannedComboEditRow,
} from '../../components/meals/PlannedComboEditRow';
import { SelectComboSheet } from '../../components/meals/SelectComboSheet';
import { Button, PermissionDeniedScreen } from '../../components/ui';
import { useScreenBackButton } from '../../hooks/useScreenBackButton';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { addDaysIsoDate, formatMenuDate } from '../../utils/mealDates';
import {
  loadMenuDraft,
  mergeCombosIntoOptions,
  findPlannedComboByChipId,
  getDraftOptionFoodType,
  getDraftOptionItemNames,
  resolvePlannedComboItemNames,
  reindexMenuOptions,
  saveMenuDraft,
  toMenuDraftOption,
  type MenuDraftOption,
} from '../../utils/dailyMenuDraft';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import {
  parsePriceInput,
  hasComboPrice,
  resolveMenuOptionCurrency,
  resolveMenuOptionPrice,
  validatePriceInput,
} from '../../utils/comboPrice';
import {
  applyDraftPricesToCombos,
  comboPriceDraftErrorMessage,
  persistComboPriceDraft,
  type ComboPriceDraftErrors,
} from '../../utils/comboSelectionPricing';

type Nav = NativeStackNavigationProp<MainStackParamList>;

function optionChipId(option: MenuDraftOption): string {
  if (option.entryType === 'PACKAGE') {
    return option.label;
  }
  return option.comboId ?? option.label;
}

type DailyMenuEditScreenProps = {
  spaceId: UUID;
  menuDate: string;
  mealType: MealType;
};

export function DailyMenuEditScreen({ spaceId, menuDate, mealType }: DailyMenuEditScreenProps) {
  useScreenBackButton(false);
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const permissions = useSpacePermissions(spaceId);
  const showToast = useToastStore(state => state.showToast);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<MenuDraftOption[]>([]);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [createComboSheetOpen, setCreateComboSheetOpen] = useState(false);
  const [createComboReturnToSelect, setCreateComboReturnToSelect] = useState(false);
  const [comboSheetOpen, setComboSheetOpen] = useState(false);
  const [comboPreviewOpen, setComboPreviewOpen] = useState(false);
  const [comboPreviewName, setComboPreviewName] = useState('');
  const [comboPreviewItems, setComboPreviewItems] = useState<string[]>([]);
  const [comboPreviewPrice, setComboPreviewPrice] = useState<number | null | undefined>();
  const [comboPreviewCurrency, setComboPreviewCurrency] = useState<string | null | undefined>();
  const [comboPreviewLoading, setComboPreviewLoading] = useState(false);
  const [comboById, setComboById] = useState<Map<string, MealComboResponse>>(new Map());
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [priceErrors, setPriceErrors] = useState<ComboPriceDraftErrors>({});
  const [savingPriceChipId, setSavingPriceChipId] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('meals.planning.editTitle', { meal: t(mealTypeLabelKey(mealType)) }),
    });
  }, [mealType, navigation, t]);

  useEffect(() => {
    setOptions([]);
    setNotes('');
    setStatus('DRAFT');
    setLoading(true);
    setComboSheetOpen(false);
    setPriceDrafts({});
    setPriceErrors({});
  }, [mealType, menuDate, spaceId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          const [draft, comboList] = await Promise.all([
            loadMenuDraft(spaceId, menuDate, mealType),
            mealsApi.getMealCombos(spaceId).catch(() => []),
          ]);
          if (!active) {
            return;
          }
          setComboById(new Map(comboList.map(combo => [combo.comboId, combo])));
          const comboOptions = draft.options.filter(option => option.entryType !== 'ITEM');
          setOptions(comboOptions);
          setNotes(draft.notes);
          setStatus(draft.menu?.status ?? 'DRAFT');
          const comboMap = new Map(comboList.map(combo => [combo.comboId, combo]));
          setPriceDrafts(
            comboOptions.reduce<Record<string, string>>((acc, option) => {
              acc[optionChipId(option)] = comboPriceDraftFromOption(
                resolveMenuOptionPrice(option, comboMap),
              );
              return acc;
            }, {}),
          );

          const isNewSlot = draft.menu == null;
          const hasPlannedCombos = comboOptions.some(
            option => option.entryType === 'COMBO' || option.entryType === 'PACKAGE',
          );
          if (isNewSlot && !hasPlannedCombos) {
            setComboSheetOpen(true);
          } else {
            setComboSheetOpen(false);
          }
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

  if (!permissions.canManageMeals) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  const openComboPreview = (chipId: string) => {
    const option = findPlannedComboByChipId(options, chipId);
    if (!option) {
      return;
    }
    setComboPreviewName(option.label);
    setComboPreviewPrice(resolveMenuOptionPrice(option, comboById));
    setComboPreviewCurrency(resolveMenuOptionCurrency(option, comboById));
    setComboPreviewItems([]);
    setComboPreviewLoading(true);
    setComboPreviewOpen(true);
    void resolvePlannedComboItemNames(spaceId, option)
      .then(names => setComboPreviewItems(names))
      .catch(() => showToast(t('meals.errors.loadFailed')))
      .finally(() => setComboPreviewLoading(false));
  };

  const removePlannedCombo = (chipId: string) => {
    setOptions(prev =>
      prev.filter(option => {
        if (option.entryType === 'PACKAGE') {
          return option.label !== chipId;
        }
        if (option.entryType === 'COMBO') {
          return (option.comboId ?? option.label) !== chipId;
        }
        return true;
      }),
    );
  };

  const handleCreateCombo = async (
    name: string,
    itemIds: string[],
    saveToLibrary: boolean,
    price?: number | null,
  ) => {
    try {
      if (saveToLibrary) {
        const created = await mealsApi.createMealCombo(spaceId, {
          name,
          description: null,
          itemIds,
          price: price ?? null,
          currencyCode: 'INR',
        });
        setComboById(prev => new Map(prev).set(created.comboId, created));
        setOptions(prev =>
          reindexMenuOptions([
            ...prev,
            {
              entryType: 'COMBO',
              comboId: created.comboId,
              itemId: null,
              label: created.name,
              sortOrder: prev.length + 1,
              isAvailable: true,
              price: created.price ?? null,
              currencyCode: created.currencyCode ?? 'INR',
            },
          ]),
        );
      } else {
        setOptions(prev =>
          reindexMenuOptions([
            ...prev,
            {
              entryType: 'PACKAGE',
              comboId: null,
              itemId: null,
              itemIds,
              label: name,
              sortOrder: prev.length + 1,
              isAvailable: true,
              price: price ?? null,
              currencyCode: 'INR',
            },
          ]),
        );
      }
      showToast(
        saveToLibrary
          ? t('meals.planning.comboSavedToLibrary', { name })
          : t('meals.planning.comboAdded', { name }),
      );
    } catch {
      showToast(t('meals.errors.saveFailed'));
      throw new Error('save failed');
    }
  };

  const handleSelectCombos = useCallback((savedCombos: MealComboResponse[]) => {
    setComboById(prev => {
      const next = new Map(prev);
      for (const combo of savedCombos) {
        next.set(combo.comboId, combo);
      }
      return next;
    });

    setOptions(prev =>
      mergeCombosIntoOptions(
        prev,
        savedCombos.map(combo => ({
          comboId: combo.comboId,
          name: combo.name,
          price: combo.price ?? null,
          currencyCode: combo.currencyCode ?? 'INR',
        })),
      ),
    );

    setPriceDrafts(() => {
      const next: Record<string, string> = {};
      for (const combo of savedCombos) {
        next[combo.comboId] = hasComboPrice(combo.price) ? String(combo.price) : '';
      }
      return next;
    });
    setPriceErrors({});

    showToast(
      savedCombos.length > 0
        ? t('meals.planning.combosSaved', { count: savedCombos.length })
        : t('meals.planning.combosCleared'),
    );
  }, [showToast, t]);

  const updateOptionPriceDraft = (chipId: string, text: string) => {
    setPriceDrafts(prev => ({ ...prev, [chipId]: text }));
    if (priceErrors[chipId]) {
      setPriceErrors(prev => {
        const next = { ...prev };
        delete next[chipId];
        return next;
      });
    }
  };

  const persistComboPriceOnBlur = useCallback(
    async (option: MenuDraftOption, draftValue: string) => {
      const chipId = optionChipId(option);
      if (option.entryType !== 'COMBO' || !option.comboId) {
        return;
      }

      const combo = comboById.get(option.comboId);
      if (!combo) {
        return;
      }

      const draft = draftValue.trim();
      if (!draft) {
        return;
      }

      const draftsForSave = { ...priceDrafts, [chipId]: draftValue };
      setSavingPriceChipId(chipId);
      try {
        const { combo: updated, error } = await persistComboPriceDraft(
          spaceId,
          combo,
          draftsForSave,
        );
        if (error) {
          setPriceErrors(prev => ({ ...prev, [chipId]: error }));
          return;
        }

        setComboById(prev => {
          const next = new Map(prev);
          next.set(updated.comboId, updated);
          return next;
        });
        setOptions(prev =>
          prev.map(row => {
            if (row.entryType === 'COMBO' && row.comboId === updated.comboId) {
              return {
                ...row,
                price: updated.price ?? null,
                currencyCode: updated.currencyCode ?? row.currencyCode ?? 'INR',
              };
            }
            return row;
          }),
        );
        setPriceDrafts(prev => ({
          ...prev,
          [chipId]: hasComboPrice(updated.price) ? String(updated.price) : prev[chipId],
        }));
      } catch {
        showToast(t('meals.errors.saveFailed'));
      } finally {
        setSavingPriceChipId(null);
      }
    },
    [comboById, priceDrafts, showToast, spaceId, t],
  );

  const copyFromYesterday = async () => {
    const sourceDate = addDaysIsoDate(menuDate, -1);
    setSaving(true);
    try {
      const copied = await mealsApi.copyDailyMenu(spaceId, menuDate, mealType, sourceDate);
      setOptions(
        copied.options.map(toMenuDraftOption).filter(option => option.entryType !== 'ITEM'),
      );
      setNotes(copied.notes ?? '');
      setStatus(copied.status);
      const copiedCombos = copied.options
        .map(toMenuDraftOption)
        .filter(option => option.entryType !== 'ITEM');
      setPriceDrafts(
        copiedCombos.reduce<Record<string, string>>((acc, option) => {
          acc[optionChipId(option)] = comboPriceDraftFromOption(
            resolveMenuOptionPrice(option, comboById),
          );
          return acc;
        }, {}),
      );
      showToast(t('meals.planning.copySuccess'));
    } catch {
      showToast(t('meals.planning.copyFailed'));
    } finally {
      setSaving(false);
    }
  };

  const syncPricesBeforeSave = async (): Promise<boolean> => {
    const comboResponses = plannedCombos
      .filter(option => option.entryType === 'COMBO' && option.comboId)
      .map(option => comboById.get(option.comboId as string))
      .filter((combo): combo is MealComboResponse => combo != null);

    const packageErrors: ComboPriceDraftErrors = {};
    for (const option of plannedCombos.filter(row => row.entryType === 'PACKAGE')) {
      const id = optionChipId(option);
      const draft = priceDrafts[id]?.trim() ?? '';
      if (!draft) {
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
      priceDrafts,
    );
    const mergedErrors = { ...comboErrors, ...packageErrors };
    if (Object.keys(mergedErrors).length > 0) {
      setPriceErrors(mergedErrors);
      showToast(t('meals.errors.saveFailed'));
      return false;
    }

    setComboById(prev => {
      const next = new Map(prev);
      for (const combo of updatedCombos) {
        next.set(combo.comboId, combo);
      }
      return next;
    });

    setOptions(prev =>
      prev.map(option => {
        if (option.entryType !== 'PACKAGE') {
          return option;
        }
        const id = optionChipId(option);
        const draft = priceDrafts[id]?.trim() ?? '';
        const price = parsePriceInput(draft);
        if (price == null) {
          return option;
        }
        return { ...option, price, currencyCode: option.currencyCode ?? 'INR' };
      }),
    );
    setPriceErrors({});
    return true;
  };

  const buildOptionsForSave = (): MenuDraftOption[] =>
    options.map(option => {
      if (option.entryType !== 'PACKAGE') {
        return option;
      }
      const id = optionChipId(option);
      const draft = priceDrafts[id]?.trim() ?? '';
      const price = parsePriceInput(draft);
      if (price == null) {
        return option;
      }
      return { ...option, price, currencyCode: option.currencyCode ?? 'INR' };
    });

  const persist = async () => {
    if (options.length === 0) {
      showToast(t('meals.errors.optionsRequired'));
      return;
    }
    setSaving(true);
    try {
      const pricesOk = await syncPricesBeforeSave();
      if (!pricesOk) {
        return;
      }
      const nextOptions = buildOptionsForSave();
      await saveMenuDraft(spaceId, menuDate, mealType, nextOptions, notes.trim() || null);
      showToast(t('meals.success.saved'));
      navigation.goBack();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const shareMeal = async () => {
    if (options.length === 0) {
      showToast(t('meals.errors.optionsRequired'));
      return;
    }
    setSaving(true);
    try {
      const pricesOk = await syncPricesBeforeSave();
      if (!pricesOk) {
        return;
      }
      const nextOptions = buildOptionsForSave();
      await saveMenuDraft(spaceId, menuDate, mealType, nextOptions, notes.trim() || null);
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
      navigation.goBack();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const summaryText =
    plannedCombos.length > 0
      ? t('meals.menu.plannedSummary', { count: plannedCombos.length })
      : t('meals.menu.plannedSummaryEmpty');

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            <Text style={styles.date}>{formatMenuDate(menuDate, i18n.language)}</Text>
            <Text style={styles.summary}>{summaryText}</Text>
          </View>
          <View style={styles.metaRight}>
            {status === 'PUBLISHED' ? (
              <Text style={styles.published}>{t('meals.menu.published')}</Text>
            ) : (
              <Text style={styles.draft}>{t('meals.menu.draft')}</Text>
            )}
          </View>
        </View>

        <Button
          label={t('meals.menu.copyYesterdayButton')}
          variant="secondary"
          loading={saving}
          onPress={() => void copyFromYesterday()}
          style={styles.copyButton}
        />

        {plannedCombos.length > 0 ? (
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
            <Text style={styles.sectionLabel}>{t('meals.menu.plannedEntries')}</Text>

            {plannedCombos.map(option => {
              const chipId = optionChipId(option);
              const resolvedPrice = resolveMenuOptionPrice(option, comboById);
              const currency = resolveMenuOptionCurrency(option, comboById);
              const errorKey = priceErrors[chipId];
              const itemNames = getDraftOptionItemNames(option, comboById);
              const foodType = getDraftOptionFoodType(option, comboById);
              return (
                <PlannedComboEditRow
                  key={chipId}
                  name={option.label}
                  itemNames={itemNames}
                  foodType={foodType}
                  priceDraft={priceDrafts[chipId] ?? comboPriceDraftFromOption(resolvedPrice)}
                  resolvedPrice={resolvedPrice}
                  currencyCode={currency}
                  savingPrice={savingPriceChipId === chipId}
                  onPriceChange={text => updateOptionPriceDraft(chipId, text)}
                  onPriceBlur={draft => void persistComboPriceOnBlur(option, draft)}
                  onRemove={() => removePlannedCombo(chipId)}
                  onPress={() => openComboPreview(chipId)}
                  priceError={
                    errorKey ? comboPriceDraftErrorMessage(errorKey, t) : null
                  }
                />
              );
            })}

            {plannedCombos.length === 0 ? (
              <Text style={styles.emptyCombos}>{t('meals.planning.noCombosSelected')}</Text>
            ) : null}
          </>
        ) : null}

        <View style={styles.addLinks}>
          <Pressable onPress={() => setComboSheetOpen(true)}>
            <Text style={styles.addLinkText}>{t('meals.menu.addCombo')}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setCreateComboReturnToSelect(false);
              setCreateComboSheetOpen(true);
            }}>
            <Text style={styles.addLinkText}>{t('meals.menu.createCombo')}</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>{t('meals.menu.notes')}</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder={t('meals.menu.notesPlaceholder')}
        />
      </ScrollView>

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
            disabled={options.length === 0}
            onPress={() => void persist()}
            style={styles.footerButton}
          />
          <Button
            label={t('meals.actions.shareMeal')}
            loading={saving}
            disabled={options.length === 0}
            onPress={() => void shareMeal()}
            style={styles.footerButton}
          />
        </View>
      </View>

      <SelectComboSheet
        visible={comboSheetOpen}
        spaceId={spaceId}
        existingOptions={options}
        onClose={() => setComboSheetOpen(false)}
        onSave={handleSelectCombos}
        onCreateCombo={() => {
          setComboSheetOpen(false);
          setCreateComboReturnToSelect(true);
          setCreateComboSheetOpen(true);
        }}
      />

      <CreateComboSheet
        visible={createComboSheetOpen}
        spaceId={spaceId}
        existingOptions={options}
        onClose={() => {
          setCreateComboSheetOpen(false);
          setCreateComboReturnToSelect(false);
        }}
        onBack={
          createComboReturnToSelect
            ? () => {
                setCreateComboSheetOpen(false);
                setCreateComboReturnToSelect(false);
                setComboSheetOpen(true);
              }
            : undefined
        }
        onSave={handleCreateCombo}
      />

      <ComboItemsPopup
        visible={comboPreviewOpen}
        comboName={comboPreviewName}
        items={comboPreviewItems}
        price={comboPreviewPrice}
        currencyCode={comboPreviewCurrency}
        loading={comboPreviewLoading}
        onClose={() => setComboPreviewOpen(false)}
      />
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
  draft: {
    ...typography.caption,
    color: '#D97706',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  copyButton: { marginBottom: spacing.sm },
  previewLink: { marginBottom: spacing.md },
  previewLinkText: { ...typography.body, color: colors.primaryDark, fontWeight: '600' },
  loader: { marginVertical: spacing.md },
  sectionLabel: { ...typography.bodyStrong, marginTop: spacing.md, marginBottom: spacing.sm },
  emptyCombos: { ...typography.caption, color: colors.muted, marginBottom: spacing.sm },
  addLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginBottom: spacing.md },
  addLinkText: { ...typography.bodyStrong, color: colors.primaryDark },
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
