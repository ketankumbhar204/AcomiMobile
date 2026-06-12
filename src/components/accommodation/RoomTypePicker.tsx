import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RoomType } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { ROOM_TYPE_OPTIONS } from '../../utils/accommodationStatus';

type RoomTypePickerProps = {
  value: RoomType | null;
  onChange: (roomType: RoomType) => void;
  error?: string | null;
};

export function RoomTypePicker({ value, onChange, error }: RoomTypePickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('accommodation.roomType.label')}</Text>
      <View style={styles.grid}>
        {ROOM_TYPE_OPTIONS.map(roomType => {
          const isSelected = value === roomType;
          return (
            <Pressable
              key={roomType}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && !isSelected && styles.chipPressed,
              ]}
              onPress={() => onChange(roomType)}>
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {t(`accommodation.roomType.${roomType}`)}
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
    minWidth: '30%',
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
