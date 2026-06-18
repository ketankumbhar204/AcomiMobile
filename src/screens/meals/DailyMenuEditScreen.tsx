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
import { PlanningSelectionSection } from '../../components/meals/PlanningSelectionSection';
import { ComboItemsPopup } from '../../components/meals/ComboItemsPopup';
import { CreateComboSheet } from '../../components/meals/CreateComboSheet';
import { SelectComboSheet } from '../../components/meals/SelectComboSheet';
import { Button, PermissionDeniedScreen } from '../../components/ui';
import { useScreenBackButton } from '../../hooks/useScreenBackButton';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import { navigateMainStack } from '../../navigation/mainStackNavigation';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, radius, spacing, typography } from '../../theme';
import { addDaysIsoDate } from '../../utils/mealDates';
import {
  loadMenuDraft,
  mergeCombosIntoOptions,
  findPlannedComboByChipId,
  resolvePlannedComboItemNames,
  reindexMenuOptions,
  saveMenuDraft,
  toMenuDraftOption,
  type MenuDraftOption,
} from '../../utils/dailyMenuDraft';
import { mealTypeLabelKey } from '../../utils/mealLabels';
import {
  formatComboPrice,
  resolveMenuOptionCurrency,
  resolveMenuOptionPrice,
} from '../../utils/comboPrice';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type DailyMenuEditScreenProps = {
  spaceId: UUID;
  menuDate: string;
  mealType: MealType;
};

export function DailyMenuEditScreen({ spaceId, menuDate, mealType }: DailyMenuEditScreenProps) {
  useScreenBackButton(false);
  const { t } = useTranslation();
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
  const [comboPreviewLoading, setComboPreviewLoading] = useState(false);
  const [comboById, setComboById] = useState<Map<string, MealComboResponse>>(new Map());

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

  const handleSelectCombos = (combos: Array<{ comboId: string; name: string }>) => {
    setOptions(prev => mergeCombosIntoOptions(prev, combos));
    showToast(
      combos.length > 0
        ? t('meals.planning.combosSaved', { count: combos.length })
        : t('meals.planning.combosCleared'),
    );
  };

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
      showToast(t('meals.planning.copySuccess'));
    } catch {
      showToast(t('meals.planning.copyFailed'));
    } finally {
      setSaving(false);
    }
  };

  const persist = async () => {
    if (options.length === 0) {
      showToast(t('meals.errors.optionsRequired'));
      return;
    }
    setSaving(true);
    try {
      await saveMenuDraft(spaceId, menuDate, mealType, options, notes.trim() || null);
      showToast(t('meals.success.saved'));
      navigation.goBack();
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
        <Text style={styles.title}>{t(mealTypeLabelKey(mealType))}</Text>
        <Text style={styles.date}>{menuDate}</Text>
        <Text style={styles.summary}>{summaryText}</Text>

        <View style={styles.statusRow}>
          {status === 'PUBLISHED' ? (
            <Text style={styles.published}>{t('meals.menu.published')}</Text>
          ) : (
            <Text style={styles.draft}>{t('meals.menu.draft')}</Text>
          )}
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

            <PlanningSelectionSection
              title={t('meals.library.combos')}
              countLabel={t('meals.planning.selectedCount', { count: plannedCombos.length })}
              chips={plannedCombos.map(option => {
                const price = resolveMenuOptionPrice(option, comboById);
                const currency = resolveMenuOptionCurrency(option, comboById);
                const priceLabel = formatComboPrice(price, currency);
                return {
                  id:
                    option.entryType === 'PACKAGE'
                      ? option.label
                      : (option.comboId ?? option.label),
                  label: priceLabel ? `${option.label}  ${priceLabel}` : option.label,
                  variant: 'COMBO' as const,
                };
              })}
              onRemove={chipId => removePlannedCombo(chipId)}
              onChipPress={openComboPreview}
              emptyText={t('meals.planning.noCombosSelected')}
            />

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
            loading={saving}
            onPress={() => void persist()}
            style={styles.footerButtonFull}
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
        loading={comboPreviewLoading}
        onClose={() => setComboPreviewOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, paddingBottom: spacing.section },
  title: { ...typography.h2, marginBottom: spacing.xxs },
  date: { ...typography.caption, color: colors.muted, marginBottom: spacing.xs },
  summary: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  statusRow: { marginBottom: spacing.md },
  published: { ...typography.caption, color: colors.success, fontWeight: '600' },
  draft: { ...typography.caption, color: '#D97706', fontWeight: '600' },
  copyButton: { marginBottom: spacing.sm },
  previewLink: { marginBottom: spacing.md },
  previewLinkText: { ...typography.body, color: colors.primaryDark, fontWeight: '600' },
  loader: { marginVertical: spacing.md },
  sectionLabel: { ...typography.bodyStrong, marginTop: spacing.md, marginBottom: spacing.sm },
  sectionHint: { ...typography.caption, color: colors.muted, marginBottom: spacing.sm },
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
  footerButtonFull: { flex: 1 },
});
