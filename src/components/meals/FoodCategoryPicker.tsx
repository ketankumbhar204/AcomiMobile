import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { FoodCategoryResponse } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';

type FoodCategoryPickerProps = {
  categories: FoodCategoryResponse[];
  value: string | null;
  onChange: (categoryId: string) => void;
  error?: string | null;
};

export function FoodCategoryPicker({
  categories,
  value,
  onChange,
  error,
}: FoodCategoryPickerProps) {
  const { t } = useTranslation();
  const activeCategories = categories.filter(category => category.isActive);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('meals.library.categoryLabel')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {activeCategories.map(category => {
          const selected = value === category.categoryId;
          return (
            <Pressable
              key={category.categoryId}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onChange(category.categoryId)}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {category.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.lg },
  label: { ...typography.label, marginBottom: spacing.sm },
  row: { gap: spacing.sm, paddingRight: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.lightGreen,
  },
  chipText: { ...typography.caption, color: colors.textPrimary },
  chipTextSelected: { color: colors.primaryDark, fontWeight: '600' },
  error: { ...typography.caption, color: '#DC2626', marginTop: spacing.xs },
});
