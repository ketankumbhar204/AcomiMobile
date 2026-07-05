import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DailyMenuOptionResponse } from '../../api/types';
import { colors, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import { getPlannedEntryKind } from '../../utils/plannedMenuSummary';

type PlannedComboPreviewRowProps = {
  option: DailyMenuOptionResponse;
  itemNames: string[];
  price?: number | null;
  currencyCode?: string | null;
  onPress?: () => void;
};

export function PlannedComboPreviewRow({
  option,
  itemNames,
  price,
  currencyCode = 'INR',
  onPress,
}: PlannedComboPreviewRowProps) {
  const { t } = useTranslation();
  const priceLabel = formatComboPrice(price, currencyCode);
  const isCombo = getPlannedEntryKind(option) === 'combo';
  const comboSuffix = isCombo ? t('meals.menu.entryKindComboSuffix') : null;
  const canOpenDetails = isCombo && Boolean(onPress);

  const rowContent = (
    <>
      <Text style={styles.name} numberOfLines={1}>
        {option.label}
      </Text>
      {comboSuffix ? (
        <Text style={styles.comboSuffix} numberOfLines={1}>
          {comboSuffix}
        </Text>
      ) : null}
      {priceLabel ? (
        <Text style={styles.price} numberOfLines={1}>
          {priceLabel}
        </Text>
      ) : null}
      {canOpenDetails ? <Text style={styles.chevron}>›</Text> : null}
    </>
  );

  if (canOpenDetails) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.wrapper, pressed && styles.wrapperPressed]}
        accessibilityRole="button"
        accessibilityLabel={
          itemNames.length > 0
            ? `${option.label}, ${itemNames.join(', ')}${priceLabel ? `, ${priceLabel}` : ''}`
            : `${option.label}${priceLabel ? `, ${priceLabel}` : ''}`
        }>
        {rowContent}
      </Pressable>
    );
  }

  return <View style={styles.wrapper}>{rowContent}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
    borderRadius: 6,
    marginLeft: -spacing.xxs,
    paddingLeft: spacing.xxs,
    paddingRight: spacing.xxs,
    paddingVertical: 2,
  },
  wrapperPressed: {
    backgroundColor: colors.surface,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  comboSuffix: {
    ...typography.body,
    color: colors.muted,
    flexShrink: 0,
  },
  price: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  chevron: {
    ...typography.body,
    color: colors.muted,
    fontSize: 18,
    lineHeight: 20,
    paddingLeft: spacing.xxs,
    flexShrink: 0,
  },
});
