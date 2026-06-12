import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AccommodationStatus } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import {
  ACCOMMODATION_STATUS_OPTIONS,
  getAccommodationStatusColor,
} from '../../utils/accommodationStatus';

type AccommodationStatusPickerProps = {
  value: AccommodationStatus | null;
  onChange: (status: AccommodationStatus) => void;
  error?: string | null;
};

export function AccommodationStatusPicker({
  value,
  onChange,
  error,
}: AccommodationStatusPickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('accommodation.status.label')}</Text>
      <View style={styles.grid}>
        {ACCOMMODATION_STATUS_OPTIONS.map(option => {
          const isSelected = value === option.value;
          const color = getAccommodationStatusColor(option.value);
          return (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.chip,
                isSelected && { backgroundColor: `${color}14`, borderColor: color },
                pressed && !isSelected && styles.chipPressed,
              ]}
              onPress={() => onChange(option.value)}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={[styles.chipLabel, isSelected && { color }]}>
                {t(`accommodation.status.${option.value}`)}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    minWidth: '45%',
    flex: 1,
  },
  chipPressed: {
    backgroundColor: colors.surface,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xs,
  },
});
