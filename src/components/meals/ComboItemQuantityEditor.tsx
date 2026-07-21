import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FoodItemResponse } from '../../api/types';
import { colors, spacing, typography } from '../../theme';
import { normalizeComboItemQuantity } from '../../utils/comboIncludes';
import { QuantityStepper } from './QuantityStepper';

type ComboItemQuantityEditorProps = {
  items: FoodItemResponse[];
  selectedIds: string[];
  quantities: Record<string, number>;
  onQuantityChange: (itemId: string, quantity: number) => void;
};

/** Mess-only: quantity steppers for each selected combo item. */
export function ComboItemQuantityEditor({
  items,
  selectedIds,
  quantities,
  onQuantityChange,
}: ComboItemQuantityEditorProps) {
  const rows = selectedIds
    .map(id => items.find(item => item.itemId === id))
    .filter((item): item is FoodItemResponse => item != null);

  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {rows.map(item => {
        const quantity = normalizeComboItemQuantity(quantities[item.itemId]);
        return (
          <View key={item.itemId} style={styles.row}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <QuantityStepper
              quantity={quantity}
              onChange={next => onQuantityChange(item.itemId, next)}
              min={1}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  name: {
    ...typography.body,
    flex: 1,
    minWidth: 0,
  },
});
