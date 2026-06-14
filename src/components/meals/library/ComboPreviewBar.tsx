import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MealComboResponse } from '../../../api/types';
import { colors, radius, spacing, typography } from '../../../theme';

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

  const itemNames = combo.items?.map(item => item.name).filter(Boolean) ?? [];

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{t('meals.library.comboPreview')}</Text>
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
      <Text style={styles.preview} numberOfLines={3}>
        {itemNames.length > 0 ? itemNames.join(' · ') : t('meals.library.comboPreviewEmpty')}
      </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxs,
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    flex: 1,
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
});
