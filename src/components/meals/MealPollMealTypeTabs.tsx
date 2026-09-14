import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealPollSlot, MealType, UUID } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { MEAL_TYPES, mealTypeLabelKey } from '../../utils/mealLabels';
import { mealTypeTheme } from '../../utils/mealTypeTheme';
import { platesForSingleSelectOption } from '../../utils/mealSelectionSummary';

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
  poll: MealPollSlot,
  multiQuantity: boolean,
  selections: Partial<Record<MealType, UUID>>,
  quantitySelections: Partial<Record<MealType, Record<UUID, number>>>,
  totalPlatesForMeal?: (mealType: MealType) => number,
): number {
  if (multiQuantity) {
    if (totalPlatesForMeal) {
      return totalPlatesForMeal(poll.mealType);
    }
    const qtyMap = quantitySelections[poll.mealType] ?? {};
    return Object.values(qtyMap).reduce((sum, qty) => sum + (qty > 0 ? qty : 0), 0);
  }
  const selectedId = selections[poll.mealType];
  const option = selectedId ? poll.options.find(row => row.id === selectedId) : undefined;
  return platesForSingleSelectOption(option);
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
        const theme = mealTypeTheme(mealType);
        const plates = platesForMeal(
          poll,
          multiQuantity,
          selections,
          quantitySelections,
          totalPlatesForMeal,
        );
        const hasAnswer = multiQuantity
          ? plates > 0
          : Boolean(selections[mealType]);
        const statusLabel = hasAnswer
          ? t('meals.poll.tabSelected')
          : t('meals.poll.tabNotSelected');
        const countLabel = multiQuantity
          ? t('meals.poll.tabPlates', { count: plates })
          : hasAnswer
            ? String(plates)
            : '0';

        return (
          <Pressable
            key={poll.id}
            onPress={() => onSelectMealType(mealType)}
            style={({ pressed }) => [
              styles.cell,
              {
                borderColor: selected ? theme.borderStrong : theme.border,
                backgroundColor: theme.soft,
                borderWidth: selected ? 2 : 1,
              },
              pressed && styles.cellPressed,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`${t(mealTypeLabelKey(mealType))}, ${statusLabel}`}>
            <Text style={[styles.name, { color: theme.accent }]} numberOfLines={1}>
              {t(mealTypeLabelKey(mealType))}
            </Text>
            <Text
              style={[
                styles.meta,
                hasAnswer ? { color: theme.accent, fontWeight: '600' } : styles.metaEmpty,
              ]}
              numberOfLines={1}>
              {countLabel}
            </Text>
            <Text
              style={[styles.status, hasAnswer && styles.statusActive]}
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
  cellPressed: {
    opacity: 0.92,
  },
  name: {
    ...typography.bodyStrong,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 18,
  },
  meta: {
    ...typography.caption,
    fontSize: 11,
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
