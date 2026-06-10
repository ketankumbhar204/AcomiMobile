import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getSpaceTypeDescription, getSpaceTypeLabel, SPACE_TYPE_VALUES } from '../../api/spaceTypes';
import type { SpaceType } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';

type SpaceTypePickerProps = {
  value: SpaceType | null;
  onChange: (type: SpaceType) => void;
  error?: string | null;
};

export function SpaceTypePicker({ value, onChange, error }: SpaceTypePickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('spaces.types.label')}</Text>
      <View style={styles.grid}>
        {SPACE_TYPE_VALUES.map(type => {
          const isSelected = value === type;
          return (
            <Pressable
              key={type}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && !isSelected && styles.chipPressed,
              ]}
              onPress={() => onChange(type)}>
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {getSpaceTypeLabel(type)}
              </Text>
              <Text style={[styles.chipDesc, isSelected && styles.chipDescSelected]}>
                {getSpaceTypeDescription(type)}
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
    minWidth: '45%',
    flex: 1,
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
