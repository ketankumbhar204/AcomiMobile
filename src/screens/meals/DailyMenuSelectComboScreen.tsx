import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { MealComboResponse, MealType, UUID } from '../../api/types';
import { ComboPickerCard } from '../../components/meals/ComboPickerCard';
import { PlanningSelectionSection } from '../../components/meals/PlanningSelectionSection';
import { Button, PermissionDeniedScreen } from '../../components/ui';
import { useMealPricingPolicy } from '../../hooks/useMealPricingPolicy';
import { useSpacePermissions } from '../../hooks/useSpacePermissions';
import type { MainStackParamList } from '../../navigation/types';
import { useToastStore } from '../../store/toastStore';
import { colors, spacing, typography } from '../../theme';
import { isPastMenuDate } from '../../utils/mealDates';
import { loadMenuDraft, syncCombosOnMenu } from '../../utils/dailyMenuDraft';
import { fetchSpaceMenuCatalog } from '../../utils/fetchSpaceMenuCatalog';
import { hasComboPrice, getEffectivePriceDraft, parsePriceInput } from '../../utils/comboPrice';
import { formatComboIncludeLine } from '../../utils/comboIncludes';
import {
  applyDraftPricesToCombos,
  comboPriceDraftErrorMessage,
  persistComboPriceDraft,
  type ComboPriceDraftErrors,
} from '../../utils/comboSelectionPricing';
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
  const mealPricing = useMealPricingPolicy(spaceId);
  const showToast = useToastStore(state => state.showToast);
  const dateReadOnly = isPastMenuDate(menuDate);

  useEffect(() => {
    if (dateReadOnly) {
      showToast(t('meals.errors.pastDateReadOnly'));
      navigation.goBack();
    }
  }, [dateReadOnly, navigation, showToast, t]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [combos, setCombos] = useState<MealComboResponse[]>([]);
  const [selectedComboIds, setSelectedComboIds] = useState<string[]>([]);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});
  const [priceErrors, setPriceErrors] = useState<ComboPriceDraftErrors>({});
  const comboPriceSaveInFlightRef = useRef<Set<string>>(new Set());

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('meals.planning.selectComboTitle', {
        meal: t(mealTypeLabelKey(mealType)),
      }),
    });
  }, [mealType, navigation, t]);

  useEffect(() => {
    setCombos([]);
    setSelectedComboIds([]);
    setDraftPrices({});
    setPriceErrors({});
    setLoading(true);
  }, [mealType, menuDate, spaceId]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          const [comboCatalog, draft] = await Promise.all([
            fetchSpaceMenuCatalog(spaceId),
            loadMenuDraft(spaceId, menuDate, mealType),
          ]);
          if (!active) {
            return;
          }
          const activeCombos = comboCatalog.combos.filter(combo => combo.isActive);
          setCombos(activeCombos);
          const existingComboIds = draft.options
            .filter(option => option.entryType === 'COMBO' && option.comboId)
            .map(option => option.comboId as string);
          setSelectedComboIds(existingComboIds);
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
        if (error !== 'required') {
          setPriceErrors(prev => ({ ...prev, [combo.comboId]: error }));
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

  const persistSelection = async (resolvedCombos: MealComboResponse[]) => {
    await syncCombosOnMenu(
      spaceId,
      menuDate,
      mealType,
      resolvedCombos.map(combo => ({ comboId: combo.comboId, name: combo.name })),
    );
    showToast(
      resolvedCombos.length > 0
        ? t('meals.planning.combosSaved', { count: resolvedCombos.length })
        : t('meals.planning.combosCleared'),
    );
    navigation.goBack();
  };

  const saveSelection = async () => {
    setSaving(true);
    try {
      const { updatedCombos, errors } = await applyDraftPricesToCombos(
        spaceId,
        selectedCombos,
        draftPrices,
        { requirePrices: mealPricing.requiresMealPrices },
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
      await persistSelection(updatedCombos);
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
          onRemove={toggleCombo}
          emptyText={t('meals.planning.noCombosSelected')}
        />

        <Text style={styles.sectionLabel}>{t('meals.planning.availableCombos')}</Text>

        {combos.map(combo => {
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
              price={combo.price}
              currencyCode={combo.currencyCode}
              selected={selected}
              editablePrice={selected && mealPricing.requiresMealPrices}
              requiresPriceInput={false}
              showMealPrices={mealPricing.showMealPrices}
              priceDraft={priceDraft}
              onPriceDraftChange={text => updateDraftPrice(combo.comboId, text)}
              onPriceBlur={
                selected && mealPricing.requiresMealPrices
                  ? draft => {
                      void persistPriceOnBlur(combo, draft);
                    }
                  : undefined
              }
              priceInputError={errorKey ? comboPriceDraftErrorMessage(errorKey, t) : null}
              onPress={() => toggleCombo(combo.comboId)}
            />
          );
        })}

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
  loader: { marginVertical: spacing.lg },
});
