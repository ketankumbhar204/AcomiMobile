import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { MealComboResponse, UUID } from '../../api/types';
import { colors, spacing, typography } from '../../theme';
import type { MenuDraftOption } from '../../utils/dailyMenuDraft';
import { hasComboPrice } from '../../utils/comboPrice';
import {
  applyDraftPricesToCombos,
  comboPriceDraftErrorMessage,
  persistComboPriceDraft,
  type ComboPriceDraftErrors,
} from '../../utils/comboSelectionPricing';
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
  onSave: (combos: MealComboResponse[]) => void;
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
  const [saving, setSaving] = useState(false);
  const [combos, setCombos] = useState<MealComboResponse[]>([]);
  const [selectedComboIds, setSelectedComboIds] = useState<string[]>([]);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [priceErrors, setPriceErrors] = useState<ComboPriceDraftErrors>({});

  useEffect(() => {
    if (!visible) return;
    const existingComboIds = existingOptions
      .filter(option => option.entryType === 'COMBO' && option.comboId)
      .map(option => option.comboId as string);
    setSelectedComboIds(existingComboIds);
    setDraftPrices({});
    setPriceErrors({});

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

  const updateDraftPrice = (comboId: string, text: string) => {
    setDraftPrices(prev => ({ ...prev, [comboId]: text }));
    if (priceErrors[comboId]) {
      setPriceErrors(prev => {
        const next = { ...prev };
        delete next[comboId];
        return next;
      });
    }
  };

  const finishSave = (resolvedCombos: MealComboResponse[]) => {
    onSave(resolvedCombos);
    setDraftPrices({});
    setPriceErrors({});
    onClose();
  };

  const persistPriceOnBlur = async (combo: MealComboResponse, draftValue: string) => {
    const draftsForSave = { ...draftPrices, [combo.comboId]: draftValue };
    const { combo: updated, error } = await persistComboPriceDraft(
      spaceId,
      combo,
      draftsForSave,
    );
    if (error) {
      setPriceErrors(prev => ({ ...prev, [combo.comboId]: error }));
      return;
    }
    setCombos(prev =>
      prev.map(row => (row.comboId === updated.comboId ? updated : row)),
    );
    setDraftPrices(prev => ({
      ...prev,
      [combo.comboId]: hasComboPrice(updated.price) ? String(updated.price) : draftValue,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { updatedCombos, errors } = await applyDraftPricesToCombos(
        spaceId,
        selectedCombos,
        draftPrices,
      );
      if (Object.keys(errors).length > 0) {
        setPriceErrors(errors);
        setCombos(prev =>
          prev.map(combo => {
            const updated = updatedCombos.find(row => row.comboId === combo.comboId);
            return updated ?? combo;
          }),
        );
        return;
      }
      finishSave(updatedCombos);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MenuPlanningBottomSheet
      visible={visible}
      title={t('meals.planning.selectCombo')}
      onClose={onClose}
      footer={
        <SheetPrimaryButton
          label={t('common.save')}
          onPress={() => void handleSave()}
          loading={saving}
        />
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
        onRemove={id => toggleCombo(id)}
        emptyText={t('meals.planning.noCombosSelected')}
      />

      <Text style={styles.sectionLabel}>{t('meals.planning.availableCombos')}</Text>

      {!loading
        ? combos.map(combo => {
            const selected = selectedComboIds.includes(combo.comboId);
            const requiresPriceInput = !hasComboPrice(combo.price);
            const errorKey = priceErrors[combo.comboId];
            const priceDraft =
              draftPrices[combo.comboId] ??
              (hasComboPrice(combo.price) ? String(combo.price) : '');
            return (
              <ComboPickerCard
                key={combo.comboId}
                name={combo.name}
                itemNames={combo.items?.map(item => item.name).filter(Boolean) ?? []}
                foodType={combo.foodType ?? 'VEG'}
                price={combo.price}
                currencyCode={combo.currencyCode}
                selected={selected}
                editablePrice={selected}
                requiresPriceInput={requiresPriceInput}
                priceDraft={priceDraft}
                onPriceDraftChange={text => updateDraftPrice(combo.comboId, text)}
                onPriceBlur={
                  selected
                    ? draft => {
                        void persistPriceOnBlur(combo, draft);
                      }
                    : undefined
                }
                priceInputError={
                  errorKey ? comboPriceDraftErrorMessage(errorKey, t) : null
                }
                onPress={() => toggleCombo(combo.comboId)}
              />
            );
          })
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
