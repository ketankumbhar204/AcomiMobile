import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { MealComboResponse, UUID } from '../../api/types';
import { colors, spacing, typography } from '../../theme';
import type { MenuDraftOption } from '../../utils/dailyMenuDraft';
import { ComboPickerCard } from './ComboPickerCard';
import {
  MenuPlanningBottomSheet,
  SheetPrimaryButton,
} from './MenuPlanningBottomSheet';
import { PlanningSelectionSection } from './PlanningSelectionSection';

type SelectComboSheetProps = {
  visible: boolean;
  spaceId: UUID;
  existingOptions: MenuDraftOption[];
  onClose: () => void;
  onSave: (combos: Array<{ comboId: string; name: string }>) => void;
  onCreateCombo?: () => void;
};

export function SelectComboSheet({
  visible,
  spaceId,
  existingOptions,
  onClose,
  onSave,
  onCreateCombo,
}: SelectComboSheetProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [combos, setCombos] = useState<MealComboResponse[]>([]);
  const [selectedComboIds, setSelectedComboIds] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) return;
    const existingComboIds = existingOptions
      .filter(option => option.entryType === 'COMBO' && option.comboId)
      .map(option => option.comboId as string);
    setSelectedComboIds(existingComboIds);

    let active = true;
    setLoading(true);
    mealsApi
      .getMealCombos(spaceId)
      .then(list => {
        if (!active) return;
        setCombos(list.filter(combo => combo.isActive));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [visible, spaceId, existingOptions]);

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

  const handleSave = () => {
    onSave(selectedCombos.map(combo => ({ comboId: combo.comboId, name: combo.name })));
    onClose();
  };

  return (
    <MenuPlanningBottomSheet
      visible={visible}
      title={t('meals.planning.selectCombo')}
      onClose={onClose}
      footer={
        <SheetPrimaryButton label={t('common.save')} onPress={handleSave} />
      }>
      <Text style={styles.hint}>{t('meals.planning.selectComboHintMulti')}</Text>

      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      <PlanningSelectionSection
        title={t('meals.planning.selectedCombos')}
        countLabel={t('meals.planning.selectedCount', { count: selectedCombos.length })}
        chips={selectedCombos.map(combo => ({
          id: combo.comboId,
          label: combo.name,
          variant: 'COMBO',
        }))}
        onRemove={id => setSelectedComboIds(prev => prev.filter(x => x !== id))}
        emptyText={t('meals.planning.noCombosSelected')}
      />

      <Text style={styles.sectionLabel}>{t('meals.planning.availableCombos')}</Text>

      {!loading
        ? combos.map(combo => (
            <ComboPickerCard
              key={combo.comboId}
              name={combo.name}
              itemNames={combo.items?.map(item => item.name).filter(Boolean) ?? []}
              selected={selectedComboIds.includes(combo.comboId)}
              onPress={() => toggleCombo(combo.comboId)}
            />
          ))
        : null}

      {combos.length === 0 && !loading ? (
        <Text style={styles.empty}>{t('meals.library.combosEmpty')}</Text>
      ) : null}

      {onCreateCombo ? (
        <Pressable style={styles.createLink} onPress={onCreateCombo}>
          <Text style={styles.createLinkText}>{t('meals.planning.createCombo')}</Text>
        </Pressable>
      ) : null}
    </MenuPlanningBottomSheet>
  );
}

const styles = StyleSheet.create({
  hint: { ...typography.caption, color: colors.muted, marginBottom: spacing.md },
  loader: { marginVertical: spacing.lg },
  sectionLabel: { ...typography.bodyStrong, marginBottom: spacing.sm, marginTop: spacing.sm },
  empty: { ...typography.body, color: colors.muted, marginBottom: spacing.md },
  createLink: { marginTop: spacing.md, paddingVertical: spacing.sm },
  createLinkText: { ...typography.bodyStrong, color: colors.primaryDark },
});
