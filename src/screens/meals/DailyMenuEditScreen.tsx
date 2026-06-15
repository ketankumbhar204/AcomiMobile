import React, { useCallback, useMemo, useState } from 'react';
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
import type { MealComboResponse, MealType, UUID } from '../../api/types';
import { ComboPickerCard } from '../../components/meals/ComboPickerCard';
import { PlanningSelectionSection } from '../../components/meals/PlanningSelectionSection';
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
  saveMenuDraft,
  toMenuDraftOption,
  type MenuDraftOption,
} from '../../utils/dailyMenuDraft';
import { mealTypeLabelKey } from '../../utils/mealLabels';

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
  const [combos, setCombos] = useState<MealComboResponse[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [draft, comboList] = await Promise.all([
        loadMenuDraft(spaceId, menuDate, mealType),
        mealsApi.getMealCombos(spaceId),
      ]);
      setOptions(draft.options);
      setNotes(draft.notes);
      setStatus(draft.menu?.status ?? 'DRAFT');
      setCombos(comboList.filter(combo => combo.isActive));
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

  const plannedCombos = useMemo(
    () => options.filter(option => option.entryType === 'COMBO'),
    [options],
  );
  const plannedItems = useMemo(
    () => options.filter(option => option.entryType === 'ITEM'),
    [options],
  );

  const selectedComboIdSet = useMemo(
    () => new Set(plannedCombos.map(option => option.comboId).filter(Boolean)),
    [plannedCombos],
  );

  const availableCombos = useMemo(
    () => combos.filter(combo => !selectedComboIdSet.has(combo.comboId)),
    [combos, selectedComboIdSet],
  );

  if (!permissions.canManageMeals) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  const removeComboById = (comboId: string) => {
    setOptions(prev =>
      prev.filter(option => !(option.entryType === 'COMBO' && option.comboId === comboId)),
    );
  };

  const removeItemById = (itemId: string) => {
    setOptions(prev =>
      prev.filter(option => !(option.entryType === 'ITEM' && option.itemId === itemId)),
    );
  };

  const addCombo = (combo: MealComboResponse) => {
    if (selectedComboIdSet.has(combo.comboId)) {
      return;
    }
    setOptions(prev => [
      ...prev,
      {
        entryType: 'COMBO',
        comboId: combo.comboId,
        itemId: null,
        label: combo.name,
        sortOrder: prev.length + 1,
        isAvailable: true,
      },
    ]);
  };

  const copyFromYesterday = async () => {
    const sourceDate = addDaysIsoDate(menuDate, -1);
    setSaving(true);
    try {
      const copied = await mealsApi.copyDailyMenu(spaceId, menuDate, mealType, sourceDate);
      setOptions(copied.options.map(toMenuDraftOption));
      setNotes(copied.notes ?? '');
      setStatus(copied.status);
      showToast(t('meals.planning.copySuccess'));
    } catch {
      showToast(t('meals.planning.copyFailed'));
    } finally {
      setSaving(false);
    }
  };

  const persist = async (publish: boolean) => {
    if (publish && options.length === 0) {
      showToast(t('meals.errors.optionsRequired'));
      return;
    }
    setSaving(true);
    try {
      await saveMenuDraft(spaceId, menuDate, mealType, options, notes.trim() || null);
      if (publish) {
        await mealsApi.publishDailyMenu(spaceId, menuDate, mealType);
      }
      showToast(publish ? t('meals.success.published') : t('meals.success.saved'));
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
    plannedCombos.length > 0 || plannedItems.length > 0
      ? t('meals.menu.plannedSummary', {
          combos: plannedCombos.length,
          items: plannedItems.length,
        })
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

        {status === 'PUBLISHED' ? (
          <Pressable
            style={styles.previewLink}
            onPress={() =>
              navigateMainStack('MenuSharePreview', { spaceId, menuDate, mealType })
            }>
            <Text style={styles.previewLinkText}>{t('meals.planning.previewShare')}</Text>
          </Pressable>
        ) : null}

        {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        <Text style={styles.sectionLabel}>{t('meals.menu.plannedEntries')}</Text>

        <PlanningSelectionSection
          title={t('meals.library.combos')}
          countLabel={t('meals.planning.selectedCount', { count: plannedCombos.length })}
          chips={plannedCombos.map(option => ({
            id: option.comboId ?? option.label,
            label: option.label,
            variant: 'COMBO',
          }))}
          onRemove={comboId => removeComboById(comboId)}
          emptyText={t('meals.planning.noCombosSelected')}
        />

        <PlanningSelectionSection
          title={t('meals.planning.additionalItems')}
          countLabel={t('meals.planning.selectedCount', { count: plannedItems.length })}
          chips={plannedItems.map(option => ({
            id: option.itemId ?? option.label,
            label: option.label,
            variant: 'ITEM',
          }))}
          onRemove={itemId => removeItemById(itemId)}
          emptyText={t('meals.planning.noAdditionalItems')}
        />

        {availableCombos.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>{t('meals.planning.availableCombos')}</Text>
            <Text style={styles.sectionHint}>{t('meals.planning.availableCombosHint')}</Text>
            {availableCombos.map(combo => (
              <ComboPickerCard
                key={combo.comboId}
                name={combo.name}
                itemNames={combo.items?.map(item => item.name).filter(Boolean) ?? []}
                selectable={false}
                onPress={() => addCombo(combo)}
              />
            ))}
          </>
        ) : null}

        <View style={styles.addLinks}>
          <Pressable
            onPress={() =>
              navigateMainStack('DailyMenuSelectCombo', { spaceId, menuDate, mealType })
            }>
            <Text style={styles.addLinkText}>{t('meals.menu.addCombo')}</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              navigateMainStack('DailyMenuSelectItems', { spaceId, menuDate, mealType })
            }>
            <Text style={styles.addLinkText}>{t('meals.menu.addItems')}</Text>
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
            onPress={() => void persist(false)}
            style={styles.footerButton}
          />
          <Button
            label={t('meals.actions.publish')}
            loading={saving}
            onPress={() => void persist(true)}
            style={styles.footerButton}
          />
        </View>
      </View>
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
  footerButton: { flex: 1 },
});
