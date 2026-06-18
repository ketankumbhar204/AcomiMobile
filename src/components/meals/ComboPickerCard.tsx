import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';

type ComboPickerCardProps = {
  name: string;
  itemNames: string[];
  price?: number | null;
  currencyCode?: string | null;
  selected?: boolean;
  selectable?: boolean;
  compact?: boolean;
  requiresPriceInput?: boolean;
  priceDraft?: string;
  onPriceDraftChange?: (text: string) => void;
  priceInputError?: string | null;
  onPress: () => void;
};

export function ComboPickerCard({
  name,
  itemNames,
  price,
  currencyCode = 'INR',
  selected = false,
  selectable = true,
  compact = true,
  requiresPriceInput = false,
  priceDraft = '',
  onPriceDraftChange,
  priceInputError,
  onPress,
}: ComboPickerCardProps) {
  const { t } = useTranslation();
  const preview = itemNames.join(' · ');
  const priceLabel = formatComboPrice(price, currencyCode);
  const showPriceInput = selected && requiresPriceInput;

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        selectable && selected && styles.cardSelected,
      ]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selectable ? selected : undefined }}
        style={({ pressed }) => [styles.row, pressed && styles.cardPressed]}>
        {selectable ? (
          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
            <Text style={[styles.checkboxMark, selected && styles.checkboxMarkSelected]}>
              {selected ? '✓' : ''}
            </Text>
          </View>
        ) : null}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, selectable && selected && styles.nameSelected]}
              numberOfLines={1}>
              {name}
            </Text>
            {priceLabel ? <Text style={styles.price}>{priceLabel}</Text> : null}
          </View>
          {preview.length > 0 ? (
            <Text style={styles.items} numberOfLines={1}>
              {preview}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {showPriceInput ? (
        <View style={styles.priceInputBlock}>
          <Text style={styles.priceInputLabel}>{t('meals.pricing.enterPrice')}</Text>
          <View style={[styles.priceInputRow, priceInputError ? styles.priceInputRowError : null]}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              style={styles.priceInput}
              value={priceDraft}
              onChangeText={onPriceDraftChange}
              keyboardType="decimal-pad"
              placeholder={t('meals.pricing.pricePlaceholder')}
            />
          </View>
          {priceInputError ? <Text style={styles.priceInputError}>{priceInputError}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  cardCompact: {
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#ECFDF5',
  },
  cardPressed: {
    opacity: 0.92,
  },
  priceInputBlock: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  priceInputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  priceInputRowError: {
    borderColor: '#DC2626',
  },
  currency: { ...typography.bodyStrong, marginRight: spacing.xs },
  priceInput: {
    flex: 1,
    ...typography.body,
    paddingVertical: spacing.sm,
  },
  priceInputError: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    fontSize: 13,
    fontWeight: '700',
    color: 'transparent',
    lineHeight: 16,
  },
  checkboxMarkSelected: {
    color: colors.white,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: { ...typography.bodyStrong, flex: 1, minWidth: 0 },
  price: { ...typography.bodyStrong, color: colors.textSecondary },
  nameSelected: { color: colors.primaryDark },
  items: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
});
