import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealPollOption } from '../../api/types';
import { FoodTypeIcon } from '../ui/FoodTypeIcon';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';

type MealPollQuantityRowProps = {
  option: MealPollOption;
  quantity: number;
  onChange: (quantity: number) => void;
  readOnly?: boolean;
  showPrice?: boolean;
  /** Softer chrome so add-ons read differently from main combos. */
  variant?: 'default' | 'extra';
};

export function MealPollQuantityRow({
  option,
  quantity,
  onChange,
  readOnly = false,
  showPrice = true,
  variant = 'default',
}: MealPollQuantityRowProps) {
  const { t } = useTranslation();
  const selected = quantity > 0;
  const unitPrice = option.price != null ? Number(option.price) : null;
  const unitLabel =
    showPrice && unitPrice != null && !Number.isNaN(unitPrice) && unitPrice > 0
      ? formatComboPrice(unitPrice, option.currencyCode)
      : null;
  const lineTotal =
    showPrice && selected && unitPrice != null && quantity > 0
      ? formatComboPrice(unitPrice * quantity, option.currencyCode)
      : null;

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

  const priceBlock = useMemo(() => {
    if (!unitLabel) {
      return null;
    }
    return (
      <View style={styles.priceBlock}>
        <Text style={[styles.priceUnit, readOnly && styles.priceReadOnly]}>
          {t('meals.poll.priceEach', { price: unitLabel })}
        </Text>
        {lineTotal ? (
          <Text style={[styles.priceLine, readOnly && styles.priceReadOnly]}>
            {t('meals.poll.priceTimesQty', {
              unit: unitLabel,
              qty: quantity,
              total: lineTotal,
            })}
          </Text>
        ) : null}
      </View>
    );
  }, [lineTotal, quantity, readOnly, t, unitLabel]);

  const isExtra = variant === 'extra';

  return (
    <Pressable
      style={[
        styles.row,
        isExtra && styles.rowExtra,
        selected && !readOnly && styles.rowSelected,
        selected && readOnly && styles.rowSelectedReadOnly,
        readOnly && styles.rowReadOnly,
      ]}
      onPress={readOnly ? undefined : toggleSelected}
      disabled={readOnly}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled: readOnly }}>
      <View
        style={[
          styles.checkbox,
          isExtra && styles.checkboxExtra,
          readOnly && styles.checkboxReadOnly,
          selected && !readOnly && styles.checkboxSelected,
          selected && readOnly && styles.checkboxSelectedReadOnly,
        ]}>
        <Text
          style={[
            styles.checkboxMark,
            selected && !readOnly && styles.checkboxMarkSelected,
            selected && readOnly && styles.checkboxMarkSelectedReadOnly,
          ]}>
          {selected ? '✓' : ''}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          {option.optionType === 'MENU_ENTRY' && option.foodType ? (
            <FoodTypeIcon
              foodType={option.foodType}
              size={14}
              style={styles.foodTypeIcon}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              isExtra && styles.labelExtra,
              selected && !readOnly && styles.labelSelected,
              readOnly && styles.labelReadOnly,
            ]}
            numberOfLines={2}>
            {option.label}
          </Text>
        </View>

        {option.detail ? (
          <Text style={[styles.detail, readOnly && styles.detailReadOnly]} numberOfLines={2}>
            {option.detail}
          </Text>
        ) : null}

        <View style={styles.bottomRow}>
          {priceBlock}
          {selected && !readOnly ? (
            <Pressable style={styles.controls} onPress={event => event.stopPropagation()}>
              <Pressable
                style={[styles.button, quantity <= 1 && styles.buttonDisabled]}
                onPress={decrement}
                disabled={quantity <= 1}
                accessibilityLabel={t('navigation.decreaseQuantity')}>
                <Text style={styles.buttonLabel}>−</Text>
              </Pressable>
              <Text style={styles.quantity}>{quantity}</Text>
              <Pressable
                style={styles.button}
                onPress={increment}
                accessibilityLabel={t('navigation.increaseQuantity')}>
                <Text style={styles.buttonLabel}>+</Text>
              </Pressable>
            </Pressable>
          ) : null}
          {selected && readOnly ? (
            <Text style={styles.quantityReadOnly}>× {quantity}</Text>
          ) : null}
        </View>
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
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  rowExtra: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  rowSelected: {
    borderColor: colors.primary,
    borderStyle: 'solid',
    backgroundColor: colors.lightGreen,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowSelectedReadOnly: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowReadOnly: {
    opacity: 1,
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
  checkboxExtra: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.muted,
  },
  checkboxReadOnly: {
    borderColor: colors.muted,
    backgroundColor: colors.surface,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
  },
  checkboxSelectedReadOnly: {
    borderColor: colors.muted,
    backgroundColor: colors.muted,
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
  checkboxMarkSelectedReadOnly: {
    color: colors.white,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 22,
  },
  foodTypeIcon: {
    flexShrink: 0,
  },
  label: {
    ...typography.bodyStrong,
    flex: 1,
    minWidth: 0,
  },
  labelExtra: {
    ...typography.body,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.primaryDark,
  },
  labelReadOnly: {
    color: colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minHeight: 32,
  },
  priceBlock: {
    alignItems: 'flex-start',
    flexShrink: 1,
    minWidth: 0,
  },
  priceUnit: {
    ...typography.caption,
    color: colors.muted,
  },
  priceLine: {
    ...typography.bodyStrong,
    fontSize: 13,
    color: colors.primaryDark,
  },
  priceReadOnly: {
    color: colors.muted,
  },
  detail: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  detailReadOnly: {
    color: colors.muted,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
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
  quantityReadOnly: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.muted,
    flexShrink: 0,
  },
});
