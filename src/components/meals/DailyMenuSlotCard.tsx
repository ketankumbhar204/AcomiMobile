import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DailyMenuResponse, MealType } from '../../api/types';
import { Card } from '../ui/Card';
import { colors, spacing, typography } from '../../theme';
import { mealTypeLabelKey } from '../../utils/mealLabels';

type DailyMenuSlotCardProps = {
  menu?: DailyMenuResponse | null;
  mealType: MealType;
  onPress?: () => void;
  showManageHint?: boolean;
};

export function DailyMenuSlotCard({
  menu,
  mealType,
  onPress,
  showManageHint = false,
}: DailyMenuSlotCardProps) {
  const { t } = useTranslation();
  const published = menu?.status === 'PUBLISHED';
  const options = menu?.options?.filter(option => option.isAvailable) ?? [];

  const content = (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.slotTitle}>{t(mealTypeLabelKey(mealType))}</Text>
        <Text style={[styles.status, published ? styles.published : styles.draft]}>
          {published ? t('meals.menu.published') : t('meals.menu.notPlanned')}
        </Text>
      </View>
      {options.length > 0 ? (
        options.map((option, index) => (
          <Text key={`${option.label}-${index}`} style={styles.option}>
            • {option.label}
          </Text>
        ))
      ) : (
        <Text style={styles.empty}>{t('meals.menu.noItemsYet')}</Text>
      )}
      {menu?.notes ? <Text style={styles.notes}>{menu.notes}</Text> : null}
      {showManageHint && onPress ? (
        <View style={styles.actions}>
          <Text style={styles.hint}>{t('meals.menu.addCombo')}</Text>
          <Text style={styles.hint}>{t('meals.menu.addItems')}</Text>
        </View>
      ) : null}
    </Card>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  pressed: { opacity: 0.92 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  slotTitle: { ...typography.bodyStrong },
  status: { ...typography.caption, fontWeight: '600' },
  published: { color: colors.success },
  draft: { color: colors.muted },
  option: { ...typography.body, marginBottom: spacing.xs },
  empty: { ...typography.body, color: colors.muted },
  notes: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  actions: { marginTop: spacing.sm, gap: spacing.xs },
  hint: { ...typography.caption, color: colors.primary, fontWeight: '600' },
});
