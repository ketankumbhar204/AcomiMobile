import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MenuHistoryItemResponse } from '../../api/types';
import { FoodTypeIcon } from '../ui/FoodTypeIcon';
import { colors, radius, spacing, typography } from '../../theme';
import { formatComboPrice } from '../../utils/comboPrice';
import {
  formatHistoryLastUsedLabel,
} from '../../utils/menuHistoryGroups';

type HistoryPickerCardProps = {
  item: MenuHistoryItemResponse;
  selected?: boolean;
  showMealPrices?: boolean;
  onPress: () => void;
};

export function HistoryPickerCard({
  item,
  selected = false,
  showMealPrices = false,
  onPress,
}: HistoryPickerCardProps) {
  const { t, i18n } = useTranslation();
  const priceLabel = showMealPrices
    ? formatComboPrice(item.price, item.currencyCode ?? 'INR')
    : null;
  const lastUsed = formatHistoryLastUsedLabel(
    item,
    iso => {
      try {
        return new Date(iso).toLocaleDateString(i18n.language, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      } catch {
        return iso;
      }
    },
    {
      today: t('meals.planning.historyGroupToday'),
      yesterday: t('meals.planning.historyGroupYesterday'),
    },
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        <Text style={[styles.checkboxMark, selected && styles.checkboxMarkSelected]}>
          {selected ? '✓' : ''}
        </Text>
      </View>

      <View style={styles.thumb}>
        <FoodTypeIcon foodType={item.foodType ?? 'VEG'} size={18} />
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, selected && styles.nameSelected]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {t(`meals.foodType.${item.foodType ?? 'VEG'}`, {
                defaultValue: String(item.foodType ?? 'VEG'),
              })}
            </Text>
          </View>
        </View>
        {item.summary ? (
          <Text style={styles.summary} numberOfLines={1}>
            {item.summary}
          </Text>
        ) : null}
        <Text style={styles.meta} numberOfLines={1}>
          {t('meals.planning.historyUsedCount', { count: item.usageCount })} · {lastUsed}
        </Text>
      </View>

      {priceLabel ? <Text style={styles.price}>{priceLabel}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#E8F5F0',
  },
  cardPressed: {
    opacity: 0.9,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  checkboxMarkSelected: {
    color: colors.white,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
  name: {
    ...typography.bodyStrong,
    color: colors.text,
    flexShrink: 1,
  },
  nameSelected: {
    color: colors.primaryDark ?? colors.primary,
  },
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
  },
  summary: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  price: {
    ...typography.bodyStrong,
    color: colors.text,
    marginLeft: spacing.xs,
  },
});
