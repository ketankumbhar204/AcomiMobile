import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FoodItemResponse } from '../../../api/types';
import { MenuChip } from './MenuChip';
import { colors, spacing, typography } from '../../../theme';

type ComboSelectionReviewProps = {
  comboName?: string;
  description?: string;
  items: FoodItemResponse[];
  selectedIds: string[];
  onRemoveItem: (itemId: string) => void;
  error?: string | null;
};

function buildSelectedItems(
  items: FoodItemResponse[],
  selectedIds: string[],
): FoodItemResponse[] {
  return items
    .filter(item => item.isActive && selectedIds.includes(item.itemId))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function ComboSelectionReview({
  comboName,
  description,
  items,
  selectedIds,
  onRemoveItem,
  error,
}: ComboSelectionReviewProps) {
  const { t } = useTranslation();

  const selectedItems = useMemo(
    () => buildSelectedItems(items, selectedIds),
    [items, selectedIds],
  );

  const trimmedName = comboName?.trim() ?? '';
  const trimmedDescription = description?.trim() ?? '';
  const hasSelection = selectedItems.length > 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text
          style={[styles.comboName, !trimmedName && styles.comboNamePlaceholder]}
          numberOfLines={1}>
          {trimmedName || t('meals.library.comboReviewUntitled')}
        </Text>
        <Text style={styles.count}>
          {t('meals.library.comboReviewCount', { count: selectedItems.length })}
        </Text>
      </View>

      {trimmedDescription ? (
        <Text style={styles.description} numberOfLines={1}>
          {trimmedDescription}
        </Text>
      ) : null}

      {!hasSelection ? (
        <Text style={styles.empty}>{t('meals.library.comboReviewEmpty')}</Text>
      ) : (
        <ScrollView
          style={styles.chipScroll}
          contentContainerStyle={styles.chipGrid}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}>
          {selectedItems.map(item => (
            <MenuChip
              key={item.itemId}
              label={item.name}
              variant="item"
              size="compact"
              selected
              isCustom={item.isCustom}
              onPress={() => onRemoveItem(item.itemId)}
            />
          ))}
        </ScrollView>
      )}

      {hasSelection ? (
        <Text style={styles.hint}>{t('meals.library.comboReviewHint')}</Text>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xxs,
  },
  comboName: {
    ...typography.bodyStrong,
    flex: 1,
  },
  comboNamePlaceholder: {
    color: colors.muted,
    fontWeight: '500',
  },
  count: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  description: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  empty: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xxs,
  },
  chipScroll: {
    maxHeight: 96,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingBottom: spacing.xxs,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    fontSize: 11,
  },
  error: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xxs,
  },
});
