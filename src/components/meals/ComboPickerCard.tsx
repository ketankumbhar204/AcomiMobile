import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FoodType } from '../../api/types';
import { FoodTypeIcon } from '../ui/FoodTypeIcon';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';

type ComboPickerCardProps = {
  name: string;
  itemNames: string[];
  foodType?: FoodType | null;
  price?: number | null;
  currencyCode?: string | null;
  selected?: boolean;
  selectable?: boolean;
  compact?: boolean;
  requiresPriceInput?: boolean;
  priceDraft?: string;
  onPriceDraftChange?: (text: string) => void;
  onPriceBlur?: (priceDraft: string) => void;
  priceInputError?: string | null;
  /** When true, focuses the price field (e.g. after Save/Share validation). */
  focusPriceInput?: boolean;
  editablePrice?: boolean;
  showMealPrices?: boolean;
  onPress: () => void;
};

export function ComboPickerCard({
  name,
  itemNames,
  foodType = 'VEG',
  price,
  currencyCode = 'INR',
  selected = false,
  selectable = true,
  compact = true,
  requiresPriceInput = false,
  priceDraft = '',
  onPriceDraftChange,
  onPriceBlur,
  priceInputError,
  focusPriceInput = false,
  editablePrice = false,
  showMealPrices = true,
  onPress,
}: ComboPickerCardProps) {
  const { t } = useTranslation();
  const preview = itemNames.join(' · ');
  const priceLabel = showMealPrices ? formatComboPrice(price, currencyCode) : null;
  const showInlinePriceInput =
    showMealPrices && selected && editablePrice && onPriceDraftChange;
  const showExpandedPriceInput =
    showMealPrices && selected && requiresPriceInput && onPriceDraftChange && !editablePrice;

  const priceDraftRef = useRef(priceDraft);
  const priceInputRef = useRef<TextInput>(null);
  useEffect(() => {
    priceDraftRef.current = priceDraft;
  }, [priceDraft]);

  useEffect(() => {
    if (!focusPriceInput) {
      return;
    }
    const timer = setTimeout(() => {
      priceInputRef.current?.focus();
    }, 80);
    return () => clearTimeout(timer);
  }, [focusPriceInput]);

  const handlePriceDraftChange = useCallback(
    (text: string) => {
      priceDraftRef.current = text;
      onPriceDraftChange?.(text);
    },
    [onPriceDraftChange],
  );

  const commitPriceBlur = useCallback(() => {
    onPriceBlur?.(priceDraftRef.current);
  }, [onPriceBlur]);

  const renderInlinePriceInput = () => (
    <View style={styles.inlinePriceBlock}>
      <View style={[styles.inlinePriceRow, priceInputError ? styles.priceInputRowError : null]}>
        <Text style={styles.inlineCurrency}>₹</Text>
        <TextInput
          ref={priceInputRef}
          style={styles.inlinePriceInput}
          value={priceDraft}
          onChangeText={handlePriceDraftChange}
          onBlur={commitPriceBlur}
          onEndEditing={commitPriceBlur}
          keyboardType="decimal-pad"
          placeholder={t('meals.pricing.pricePlaceholder')}
          placeholderTextColor={colors.muted}
        />
      </View>
      {priceInputError ? (
        <Text style={styles.inlinePriceError} numberOfLines={2}>
          {priceInputError}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        selectable && selected && styles.cardSelected,
      ]}>
      <View style={styles.row}>
        <Pressable
          onPress={onPress}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selectable ? selected : undefined }}
          style={({ pressed }) => [styles.selectablePressable, pressed && styles.cardPressed]}>
          {selectable ? (
            <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
              <Text style={[styles.checkboxMark, selected && styles.checkboxMarkSelected]}>
                {selected ? '✓' : ''}
              </Text>
            </View>
          ) : null}
          <View style={styles.content}>
            <View style={styles.nameRow}>
              <FoodTypeIcon foodType={foodType} size={14} />
              <Text
                style={[styles.name, selectable && selected && styles.nameSelected]}
                numberOfLines={1}>
                {name}
              </Text>
            </View>
            {preview.length > 0 ? (
              <Text style={styles.items} numberOfLines={1}>
                {preview}
              </Text>
            ) : null}
          </View>
        </Pressable>
        {showInlinePriceInput ? (
          renderInlinePriceInput()
        ) : priceLabel ? (
          <Text style={styles.price}>{priceLabel}</Text>
        ) : null}
      </View>

      {showExpandedPriceInput ? (
        <View style={styles.priceInputBlock}>
          <Text style={styles.priceInputLabel}>{t('meals.pricing.enterPrice')}</Text>
          <View style={[styles.priceInputRow, priceInputError ? styles.priceInputRowError : null]}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              ref={priceInputRef}
              style={styles.priceInput}
              value={priceDraft}
              onChangeText={handlePriceDraftChange}
              onBlur={commitPriceBlur}
              onEndEditing={commitPriceBlur}
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
    borderColor: '#F87171',
    backgroundColor: '#FFF5F5',
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
  selectablePressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    minWidth: 0,
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
    gap: spacing.xs,
  },
  name: { ...typography.bodyStrong, flex: 1, minWidth: 0 },
  price: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    flexShrink: 0,
    marginTop: 1,
  },
  inlinePriceBlock: {
    flexShrink: 0,
    alignItems: 'flex-end',
    maxWidth: 110,
    marginTop: 1,
  },
  inlinePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.white,
  },
  inlineCurrency: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  inlinePriceInput: {
    width: 52,
    ...typography.bodyStrong,
    fontSize: 14,
    paddingVertical: 4,
    color: colors.textPrimary,
  },
  inlinePriceError: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: 2,
    textAlign: 'right',
    alignSelf: 'stretch',
  },
  nameSelected: { color: colors.primaryDark },
  items: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
});
