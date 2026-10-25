import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme';
import {
  PRICE_BASIS_LABEL,
  PRICE_BASIS_OPTIONS,
  type ListingPriceBasis,
} from '../../utils/priceBasis';

type PriceBasisPickerProps = {
  value: ListingPriceBasis;
  onChange: (value: ListingPriceBasis) => void;
};

export function PriceBasisPicker({ value, onChange }: PriceBasisPickerProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {t('spaces.findPlace.pricingUnit', { defaultValue: 'Pricing unit' })}
      </Text>
      <View style={styles.row}>
        {PRICE_BASIS_OPTIONS.map(option => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option)}
              style={[styles.option, selected && styles.optionSelected]}>
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {t(`spaces.findPlace.priceBasis.${option}`, { defaultValue: PRICE_BASIS_LABEL[option] })}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: '#E8F8EE' },
  optionText: { fontSize: 13, color: colors.textSecondary },
  optionTextSelected: { color: colors.primaryDark, fontWeight: '700' },
});
