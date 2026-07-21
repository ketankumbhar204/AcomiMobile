import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealPollSlot, MealType, UUID } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { MEAL_TYPES, mealTypeLabelKey } from '../../utils/mealLabels';

type MealPollMealTypeTabsProps = {
  polls: MealPollSlot[];
  selectedMealType: MealType;
  onSelectMealType: (mealType: MealType) => void;
  multiQuantity: boolean;
  selections: Partial<Record<MealType, UUID>>;
  quantitySelections: Partial<Record<MealType, Record<UUID, number>>>;
  totalPlatesForMeal?: (mealType: MealType) => number;
};

function platesForMeal(
  mealType: MealType,
  multiQuantity: boolean,
  selections: Partial<Record<MealType, UUID>>,
  quantitySelections: Partial<Record<MealType, Record<UUID, number>>>,
  totalPlatesForMeal?: (mealType: MealType) => number,
): number {
  if (multiQuantity) {
    if (totalPlatesForMeal) {
      return totalPlatesForMeal(mealType);
    }
    const qtyMap = quantitySelections[mealType] ?? {};
    return Object.values(qtyMap).reduce((sum, qty) => sum + (qty > 0 ? qty : 0), 0);
  }
  return selections[mealType] ? 1 : 0;
}

/** Compact Breakfast / Lunch / Dinner tabs for customer meal selection. */
export function MealPollMealTypeTabs({
  polls,
  selectedMealType,
  onSelectMealType,
  multiQuantity,
  selections,
  quantitySelections,
  totalPlatesForMeal,
}: MealPollMealTypeTabsProps) {
  const { t } = useTranslation();
  const sorted = [...polls].sort(
    (a, b) => MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType),
  );

  if (sorted.length <= 1) {
    return null;
  }

  return (
    <View style={styles.strip} accessibilityRole="tablist">
      {sorted.map(poll => {
        const mealType = poll.mealType;
        const selected = selectedMealType === mealType;
        const plates = platesForMeal(
          mealType,
          multiQuantity,
          selections,
          quantitySelections,
          totalPlatesForMeal,
        );
        const hasSelection = plates > 0;
        const statusLabel = hasSelection
          ? t('meals.poll.tabSelected')
          : t('meals.poll.tabNotSelected');
        const countLabel = multiQuantity
          ? t('meals.poll.tabPlates', { count: plates })
          : hasSelection
            ? '1'
            : '0';

        return (
          <Pressable
            key={poll.id}
            onPress={() => onSelectMealType(mealType)}
            style={({ pressed }) => [
              styles.cell,
              selected && styles.cellSelected,
              pressed && styles.cellPressed,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${t(mealTypeLabelKey(mealType))}, ${statusLabel}`}>
            <Text
              style={[styles.name, selected && styles.nameSelected]}
              numberOfLines={1}>
              {t(mealTypeLabelKey(mealType))}
            </Text>
            <Text
              style={[
                styles.meta,
                hasSelection ? styles.metaSelected : styles.metaEmpty,
              ]}
              numberOfLines={1}>
              {countLabel}
            </Text>
            <Text
              style={[styles.status, hasSelection && styles.statusActive]}
              numberOfLines={1}>
              {statusLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cell: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  cellSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: `${colors.primary}12`,
  },
  cellPressed: {
    opacity: 0.92,
  },
  name: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  nameSelected: {
    color: colors.primaryDark,
  },
  meta: {
    ...typography.caption,
    fontSize: 11,
  },
  metaSelected: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  metaEmpty: {
    color: colors.muted,
  },
  status: {
    ...typography.caption,
    fontSize: 10,
    color: colors.muted,
  },
  statusActive: {
    color: colors.success,
    fontWeight: '600',
  },
});
