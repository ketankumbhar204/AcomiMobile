import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { GenderPolicy, SpaceType } from '../../api/types';
import {
  PROPERTY_CATEGORY_VALUES,
  propertyCategoryLabelKey,
} from '../../utils/spacePropertyCategory';
import { colors, radius, spacing, typography } from '../../theme';

type SpacePropertyCategoryPickerProps = {
  spaceType: SpaceType;
  value: GenderPolicy | null;
  onChange: (value: GenderPolicy) => void;
  error?: string | null;
};

export function SpacePropertyCategoryPicker({
  spaceType,
  value,
  onChange,
  error,
}: SpacePropertyCategoryPickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('spaces.propertyCategory.label')}</Text>
      <View style={styles.row}>
        {PROPERTY_CATEGORY_VALUES.map(policy => {
          const isSelected = value === policy;
          return (
            <Pressable
              key={policy}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && !isSelected && styles.chipPressed,
              ]}
              onPress={() => onChange(policy)}>
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {t(propertyCategoryLabelKey(spaceType, policy))}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    minWidth: '30%',
    flexGrow: 1,
  },
  chipSelected: {
    backgroundColor: colors.lightGreen,
    borderColor: colors.primary,
  },
  chipPressed: {
    backgroundColor: colors.surface,
  },
  chipLabel: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  chipLabelSelected: {
    color: colors.primaryDark,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xs,
  },
});
