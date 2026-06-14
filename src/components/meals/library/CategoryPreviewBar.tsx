import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FoodCategoryResponse } from '../../../api/types';
import { colors, radius, spacing, typography } from '../../../theme';

type CategoryPreviewBarProps = {
  category: FoodCategoryResponse | null;
  itemCount: number;
  canManage?: boolean;
  onRemove?: () => void;
};

export function CategoryPreviewBar({
  category,
  itemCount,
  canManage = false,
  onRemove,
}: CategoryPreviewBarProps) {
  const { t } = useTranslation();

  if (!category || !canManage) {
    return null;
  }

  const scopeHint =
    category.scope === 'GLOBAL'
      ? t('meals.library.globalCatalog')
      : t('meals.library.spaceCatalog');

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={styles.copy}>
          <Text style={styles.label}>{scopeHint}</Text>
          <Text style={styles.meta}>
            {t('meals.library.categoryMeta', { count: itemCount })}
          </Text>
        </View>
        {onRemove ? (
          <Pressable
            onPress={onRemove}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
            hitSlop={8}>
            <Text style={styles.actionRemove}>{t('meals.library.removeCategory')}</Text>
          </Pressable>
        ) : null}
      </View>
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
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
  },
  meta: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: spacing.xxs,
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
  actionRemove: {
    ...typography.caption,
    color: '#DC2626',
    fontWeight: '700',
  },
});
