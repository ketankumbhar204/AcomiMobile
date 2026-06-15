import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { MealComboResponse, MealType, UUID } from '../../api/types';
import { ComboPickerCard } from '../../components/meals/ComboPickerCard';
import { PlanningSelectionSection } from '../../components/meals/PlanningSelectionSection';
import { Button, PermissionDeniedScreen } from '../../components/ui';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { loadMenuDraft, syncCombosOnMenu } from '../../utils/dailyMenuDraft';
import { mealTypeLabelKey } from '../../utils/mealLabels';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type DailyMenuSelectComboScreenProps = {
  spaceId: UUID;
  menuDate: string;
  mealType: MealType;
};

export function DailyMenuSelectComboScreen({
  spaceId,
  menuDate,
  mealType,
}: DailyMenuSelectComboScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const permissions = useSpacePermissions(spaceId);
  const showToast = useToastStore(state => state.showToast);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [combos, setCombos] = useState<MealComboResponse[]>([]);
  const [selectedComboIds, setSelectedComboIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [comboList, draft] = await Promise.all([
        mealsApi.getMealCombos(spaceId),
        loadMenuDraft(spaceId, menuDate, mealType),
      ]);
      const activeCombos = comboList.filter(combo => combo.isActive);
      setCombos(activeCombos);
      const existingComboIds = draft.options
        .filter(option => option.entryType === 'COMBO' && option.comboId)
        .map(option => option.comboId as string);
      setSelectedComboIds(existingComboIds);
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

  const selectedCombos = useMemo(
    () =>
      selectedComboIds
        .map(id => combos.find(combo => combo.comboId === id))
        .filter((combo): combo is MealComboResponse => combo != null),
    [combos, selectedComboIds],
  );

  const toggleCombo = (comboId: string) => {
    setSelectedComboIds(prev =>
      prev.includes(comboId) ? prev.filter(id => id !== comboId) : [...prev, comboId],
    );
  };

  const removeCombo = (comboId: string) => {
    setSelectedComboIds(prev => prev.filter(id => id !== comboId));
  };

  const saveSelection = async () => {
    setSaving(true);
    try {
      await syncCombosOnMenu(
        spaceId,
        menuDate,
        mealType,
        selectedCombos.map(combo => ({ comboId: combo.comboId, name: combo.name })),
      );
      showToast(
        selectedCombos.length > 0
          ? t('meals.planning.combosSaved', { count: selectedCombos.length })
          : t('meals.planning.combosCleared'),
      );
      navigation.goBack();
    } catch {
      showToast(t('meals.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (!permissions.canManageMeals) {
    return <PermissionDeniedScreen spaceId={spaceId} />;
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>{t(mealTypeLabelKey(mealType))}</Text>
        <Text style={styles.title}>{t('meals.planning.selectCombo')}</Text>
        <Text style={styles.subtitle}>{t('meals.planning.selectComboHintMulti')}</Text>

        {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {!loading && combos.length > 0 ? (
          <Text style={styles.multiSelectHint}>{t('meals.planning.multiSelectHint')}</Text>
        ) : null}

        <PlanningSelectionSection
          title={t('meals.planning.selectedCombos')}
          countLabel={t('meals.planning.selectedCount', { count: selectedCombos.length })}
          chips={selectedCombos.map(combo => ({
            id: combo.comboId,
            label: combo.name,
            variant: 'COMBO',
          }))}
          onRemove={removeCombo}
          emptyText={t('meals.planning.noCombosSelected')}
        />

        <Text style={styles.sectionLabel}>{t('meals.planning.availableCombos')}</Text>

        {combos.map(combo => (
          <ComboPickerCard
            key={combo.comboId}
            name={combo.name}
            itemNames={combo.items?.map(item => item.name).filter(Boolean) ?? []}
            selected={selectedComboIds.includes(combo.comboId)}
            onPress={() => toggleCombo(combo.comboId)}
          />
        ))}

        {combos.length === 0 && !loading ? (
          <Text style={styles.empty}>{t('meals.library.combosEmpty')}</Text>
        ) : null}

        <Pressable
          style={styles.createLink}
          onPress={() => navigation.navigate('MealComboForm', { spaceId, mode: 'create' })}>
          <Text style={styles.createLinkText}>{t('meals.planning.createCombo')}</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t('common.save')}
          loading={saving}
          onPress={() => void saveSelection()}
          style={styles.footerButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xxl, paddingBottom: spacing.md },
  eyebrow: { ...typography.caption, color: colors.muted, fontWeight: '600', marginBottom: spacing.xxs },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: spacing.lg },
  multiSelectHint: { ...typography.caption, color: colors.muted, marginBottom: spacing.sm },
  sectionLabel: { ...typography.bodyStrong, marginBottom: spacing.sm },
  empty: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  createLink: { marginTop: spacing.md, paddingVertical: spacing.md },
  createLinkText: { ...typography.bodyStrong, color: colors.primaryDark },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  footerButton: { width: '100%' },
});
