import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FoodTypeIcon } from '../ui/FoodTypeIcon';
import type { FoodType } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice, hasComboPrice } from '../../utils/comboPrice';

type PlannedComboEditRowProps = {
  name: string;
  itemNames?: string[];
  foodType?: FoodType | null;
  priceDraft: string;
  currencyCode?: string | null;
  resolvedPrice?: number | null;
  savingPrice?: boolean;
  onPriceChange: (text: string) => void;
  onPriceBlur?: (priceDraft: string) => void;
  onRemove: () => void;
  onPress?: () => void;
  priceError?: string | null;
};

export function PlannedComboEditRow({
  name,
  itemNames = [],
  foodType = 'VEG',
  priceDraft,
  currencyCode = 'INR',
  resolvedPrice,
  savingPrice = false,
  onPriceChange,
  onPriceBlur,
  onRemove,
  onPress,
  priceError,
}: PlannedComboEditRowProps) {
  const { t } = useTranslation();
  const itemsPreview = itemNames.join(' · ');
  const placeholder =
    priceDraft.trim().length > 0
      ? t('meals.pricing.pricePlaceholder')
      : (formatComboPrice(resolvedPrice, currencyCode) ?? t('meals.pricing.pricePlaceholder'));

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Pressable
            style={({ pressed }) => [styles.infoCol, pressed && onPress && styles.infoColPressed]}
            onPress={onPress}
            disabled={!onPress}>
            <View style={styles.nameRow}>
              <FoodTypeIcon foodType={foodType ?? 'VEG'} size={14} />
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
            </View>
            {itemsPreview.length > 0 ? (
              <Text style={styles.items} numberOfLines={2}>
                {itemsPreview}
              </Text>
            ) : null}
          </Pressable>

          <View style={styles.priceCol}>
            <View style={[styles.priceInputRow, priceError ? styles.priceInputRowError : null]}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                style={styles.priceInput}
                value={priceDraft}
                onChangeText={onPriceChange}
                onBlur={() => onPriceBlur?.(priceDraft)}
                keyboardType="decimal-pad"
                placeholder={placeholder}
                placeholderTextColor={colors.muted}
                editable={!savingPrice}
              />
            </View>
          </View>
        </View>
        {priceError ? <Text style={styles.priceError}>{priceError}</Text> : null}
      </View>

      <Pressable onPress={onRemove} hitSlop={8} style={styles.removeBtn}>
        <Text style={styles.removeText}>×</Text>
      </Pressable>
    </View>
  );
}

export function comboPriceDraftFromOption(
  optionPrice: number | null | undefined,
  draft?: string,
): string {
  if (draft != null && draft.trim().length > 0) {
    return draft;
  }
  if (hasComboPrice(optionPrice)) {
    return String(optionPrice);
  }
  return '';
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  infoColPressed: {
    opacity: 0.88,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  items: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  priceCol: {
    flexShrink: 0,
    alignSelf: 'center',
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    minWidth: 88,
  },
  priceInputRowError: {
    borderColor: '#DC2626',
  },
  currency: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    marginRight: 2,
  },
  priceInput: {
    width: 52,
    ...typography.bodyStrong,
    fontSize: 15,
    paddingVertical: spacing.xs,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  priceError: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xxs,
    textAlign: 'right',
  },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: 22,
    lineHeight: 24,
    color: colors.muted,
    fontWeight: '600',
  },
});
