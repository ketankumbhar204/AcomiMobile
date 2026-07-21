import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealComboResponse } from '../../../api/types';
import { FoodTypeIcon } from '../../ui/FoodTypeIcon';
import { colors, radius, spacing, typography } from '../../../theme';
import { formatComboPrice } from '../../../utils/comboPrice';
import { formatComboIncludesCompact } from '../../../utils/comboIncludes';

type ComboPreviewBarProps = {
  combo: MealComboResponse | null;
  canManage?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
};

export function ComboPreviewBar({ combo, canManage = false, onEdit, onRemove }: ComboPreviewBarProps) {
  const { t } = useTranslation();

  if (!combo) {
    return null;
  }

  const includes = formatComboIncludesCompact(
    (combo.items ?? []).map(item => ({ name: item.name, quantity: item.quantity })),
  );
  const priceLabel = formatComboPrice(combo.price, combo.currencyCode);

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <View style={styles.nameRow}>
            <FoodTypeIcon foodType={combo.foodType ?? 'VEG'} size={16} />
            <Text style={styles.comboName} numberOfLines={1}>
              {combo.name}
            </Text>
            {priceLabel ? <Text style={styles.price}>{priceLabel}</Text> : null}
          </View>
        </View>
        {canManage ? (
          <View style={styles.actions}>
            {onEdit ? (
              <Pressable
                onPress={onEdit}
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
                hitSlop={8}>
                <Text style={styles.actionEdit}>{t('meals.library.editCombo')}</Text>
              </Pressable>
            ) : null}
            {onRemove ? (
              <Pressable
                onPress={onRemove}
                style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
                hitSlop={8}>
                <Text style={styles.actionRemove}>{t('meals.library.removeCombo')}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
      {includes ? (
        <Text style={styles.preview} numberOfLines={3}>
          {t('meals.combo.includesLabel')}: {includes}
        </Text>
      ) : (
        <Text style={styles.previewEmpty}>{t('meals.library.comboPreviewEmpty')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
    gap: spacing.sm,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  comboName: {
    ...typography.bodyStrong,
    flexShrink: 1,
  },
  price: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    flexShrink: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
  },
  actionPressed: {
    opacity: 0.75,
  },
  actionEdit: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  actionRemove: {
    ...typography.caption,
    color: '#DC2626',
    fontWeight: '700',
  },
  preview: {
    ...typography.body,
    color: colors.textSecondary,
  },
  previewEmpty: {
    ...typography.caption,
    color: colors.muted,
  },
});
