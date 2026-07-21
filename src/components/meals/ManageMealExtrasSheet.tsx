import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { mealsApi } from '../../api/mealsApi';
import type { FoodItemResponse, UUID } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import type { MenuSelectionItemPackage } from '../../utils/dailyMenuDraft';
import { hasComboPrice } from '../../utils/comboPrice';
import { MenuPlanningBottomSheet, SheetPrimaryButton } from './MenuPlanningBottomSheet';

type ManageMealExtrasSheetProps = {
  visible: boolean;
  spaceId: UUID;
  enabledExtraIds: string[];
  onClose: () => void;
  onApply: (extras: MenuSelectionItemPackage[]) => void;
};

/**
 * Mess Menu Planning: pick which Menu Library extras are available for this meal.
 * No create / price edit — library is the source of truth.
 */
export function ManageMealExtrasSheet({
  visible,
  spaceId,
  enabledExtraIds,
  onClose,
  onApply,
}: ManageMealExtrasSheetProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [libraryExtras, setLibraryExtras] = useState<FoodItemResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(enabledExtraIds);

  useEffect(() => {
    if (!visible) {
      return;
    }
    setSelectedIds(enabledExtraIds);
    let active = true;
    setLoading(true);
    void mealsApi
      .getFoodItems(spaceId)
      .then(items => {
        if (!active) {
          return;
        }
        setLibraryExtras(
          items.filter(item => item.isActive && item.isExtra === true),
        );
      })
      .catch(() => {
        if (active) {
          setLibraryExtras([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [enabledExtraIds, spaceId, visible]);

  const toggle = useCallback((itemId: string) => {
    setSelectedIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId],
    );
  }, []);

  const handleApply = useCallback(() => {
    const extras: MenuSelectionItemPackage[] = [];
    for (const item of libraryExtras) {
      if (!selectedIds.includes(item.itemId)) {
        continue;
      }
      const price =
        item.defaultPrice != null && hasComboPrice(item.defaultPrice)
          ? Number(item.defaultPrice)
          : null;
      extras.push({
        itemId: item.itemId,
        name: item.name,
        price,
        currencyCode: item.currencyCode ?? 'INR',
        foodType: item.foodType ?? null,
      });
    }
    onApply(extras);
    onClose();
  }, [libraryExtras, onApply, onClose, selectedIds]);

  const sorted = useMemo(
    () => [...libraryExtras].sort((a, b) => a.name.localeCompare(b.name)),
    [libraryExtras],
  );

  return (
    <MenuPlanningBottomSheet
      visible={visible}
      title={t('meals.planning.manageExtrasTitle')}
      onClose={onClose}
      footer={
        <SheetPrimaryButton
          label={t('meals.planning.manageExtrasApply')}
          onPress={handleApply}
        />
      }>
      <Text style={styles.hint}>{t('meals.planning.manageExtrasHint')}</Text>
      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
      {!loading && sorted.length === 0 ? (
        <Text style={styles.empty}>{t('meals.planning.manageExtrasEmpty')}</Text>
      ) : null}
      {!loading
        ? sorted.map(item => {
            const selected = selectedIds.includes(item.itemId);
            const priceLabel =
              item.defaultPrice != null && hasComboPrice(item.defaultPrice)
                ? `₹${item.defaultPrice}`
                : null;
            return (
              <Pressable
                key={item.itemId}
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => toggle(item.itemId)}>
                <View style={styles.rowBody}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {priceLabel ? <Text style={styles.price}>{priceLabel}</Text> : null}
                </View>
                <Switch
                  value={selected}
                  onValueChange={() => toggle(item.itemId)}
                  trackColor={{ true: colors.primary }}
                  thumbColor={colors.white}
                />
              </Pressable>
            );
          })
        : null}
    </MenuPlanningBottomSheet>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  loader: { marginVertical: spacing.lg },
  empty: {
    ...typography.body,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  rowBody: { flex: 1, minWidth: 0 },
  name: { ...typography.bodyStrong },
  price: { ...typography.caption, color: colors.muted, marginTop: 2 },
});
