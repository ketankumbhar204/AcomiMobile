import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PropertyLayoutMode } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import {
  getLayoutModeDescriptionKey,
  getLayoutModeLabelKey,
} from '../../utils/propertyLayoutMode';

type PropertyLayoutModePickerProps = {
  value: PropertyLayoutMode | null;
  onChange: (mode: PropertyLayoutMode) => void;
  options: PropertyLayoutMode[];
  error?: string | null;
};

export function PropertyLayoutModePicker({
  value,
  onChange,
  options,
  error,
}: PropertyLayoutModePickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('accommodation.layoutMode.label')}</Text>
      <View style={styles.grid}>
        {options.map(mode => {
          const isSelected = value === mode;
          return (
            <Pressable
              key={mode}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && !isSelected && styles.chipPressed,
              ]}
              onPress={() => onChange(mode)}>
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {t(getLayoutModeLabelKey(mode))}
              </Text>
              <Text style={[styles.chipDesc, isSelected && styles.chipDescSelected]}>
                {t(getLayoutModeDescriptionKey(mode))}
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
  grid: {
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
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
  },
  chipLabelSelected: {
    color: colors.primaryDark,
  },
  chipDesc: {
    ...typography.caption,
    marginTop: 2,
    color: colors.muted,
  },
  chipDescSelected: {
    color: colors.primaryDark,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xs,
  },
});
