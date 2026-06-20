import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MealPollOption } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';

type MealPollQuantityRowProps = {
  option: MealPollOption;
  quantity: number;
  onChange: (quantity: number) => void;
  readOnly?: boolean;
};

export function MealPollQuantityRow({
  option,
  quantity,
  onChange,
  readOnly = false,
}: MealPollQuantityRowProps) {
  const selected = quantity > 0;
  const priceLabel = formatComboPrice(option.price, option.currencyCode);

  const toggleSelected = () => {
    if (readOnly) {
      return;
    }
    onChange(selected ? 0 : 1);
  };

  const decrement = () => {
    if (readOnly || quantity <= 1) {
      return;
    }
    onChange(quantity - 1);
  };

  const increment = () => {
    if (readOnly) {
      return;
    }
    onChange(quantity + 1);
  };

  return (
    <Pressable
      style={[styles.row, selected && styles.rowSelected, readOnly && styles.rowReadOnly]}
      onPress={readOnly ? undefined : toggleSelected}
      disabled={readOnly}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        <Text style={[styles.checkboxMark, selected && styles.checkboxMarkSelected]}>
          {selected ? '✓' : ''}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.mainLine}>
          <Text
            style={[styles.label, selected && styles.labelSelected]}
            numberOfLines={1}>
            {option.label}
          </Text>

          <View style={styles.trailing}>
            {priceLabel ? <Text style={styles.price}>{priceLabel}</Text> : null}

            {selected ? (
              <Pressable style={styles.controls} onPress={event => event.stopPropagation()}>
                <Pressable
                  style={[styles.button, quantity <= 1 && styles.buttonDisabled]}
                  onPress={decrement}
                  disabled={readOnly || quantity <= 1}
                  accessibilityLabel="Decrease quantity">
                  <Text style={styles.buttonLabel}>−</Text>
                </Pressable>
                <Text style={styles.quantity}>{quantity}</Text>
                <Pressable
                  style={styles.button}
                  onPress={increment}
                  disabled={readOnly}
                  accessibilityLabel="Increase quantity">
                  <Text style={styles.buttonLabel}>+</Text>
                </Pressable>
              </Pressable>
            ) : null}
          </View>
        </View>

        {option.detail ? (
          <Text style={styles.detail} numberOfLines={2}>
            {option.detail}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  rowReadOnly: {
    opacity: 0.85,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    ...typography.caption,
    fontWeight: '700',
    color: 'transparent',
    lineHeight: 16,
  },
  checkboxMarkSelected: {
    color: colors.white,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  mainLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 24,
  },
  label: {
    ...typography.bodyStrong,
    flex: 1,
    minWidth: 0,
  },
  labelSelected: {
    color: colors.primaryDark,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  price: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  detail: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  button: {
    width: 30,
    height: 30,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    ...typography.bodyStrong,
    fontSize: 18,
    color: colors.primaryDark,
    lineHeight: 20,
  },
  quantity: {
    ...typography.bodyStrong,
    fontSize: 16,
    minWidth: 18,
    textAlign: 'center',
  },
});
