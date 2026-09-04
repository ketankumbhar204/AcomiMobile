import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '../../theme';

type QuantityStepperProps = {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  disabled?: boolean;
};

/** Compact − / n / + control reused from meal poll quantity UX. */
export function QuantityStepper({
  quantity,
  onChange,
  min = 1,
  disabled = false,
}: QuantityStepperProps) {
  const { t } = useTranslation();
  const canDecrement = !disabled && quantity > min;

  return (
    <View style={styles.controls}>
      <Pressable
        style={[styles.button, !canDecrement && styles.buttonDisabled]}
        onPress={() => {
          if (canDecrement) {
            onChange(quantity - 1);
          }
        }}
        disabled={!canDecrement}
        accessibilityLabel={t('navigation.decreaseQuantity')}>
        <Text style={styles.buttonLabel}>−</Text>
      </Pressable>
      <Text style={styles.quantity}>{quantity}</Text>
      <Pressable
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={() => {
          if (!disabled) {
            onChange(quantity + 1);
          }
        }}
        disabled={disabled}
        accessibilityLabel={t('navigation.increaseQuantity')}>
        <Text style={styles.buttonLabel}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  button: {
    width: 28,
    height: 28,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
    borderColor: colors.border,
  },
  buttonLabel: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
    lineHeight: 18,
  },
  quantity: {
    ...typography.bodyStrong,
    minWidth: 22,
    textAlign: 'center',
  },
});
