import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberStatus } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';
import { MEMBER_STATUS_OPTIONS, getMemberStatusColor } from '../../utils/memberStatus';

type StatusPickerProps = {
  value: MemberStatus | null;
  onChange: (status: MemberStatus) => void;
  error?: string | null;
};

export function StatusPicker({ value, onChange, error }: StatusPickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('membership.status.label')}</Text>
      <View style={styles.grid}>
        {MEMBER_STATUS_OPTIONS.map(status => {
          const isSelected = value === status;
          const color = getMemberStatusColor(status);
          return (
            <Pressable
              key={status}
              style={({ pressed }) => [
                styles.chip,
                isSelected && { backgroundColor: `${color}14`, borderColor: color },
                pressed && !isSelected && styles.chipPressed,
              ]}
              onPress={() => onChange(status)}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text
                style={[
                  styles.chipLabel,
                  isSelected && { color },
                ]}>
                {t(`membership.status.${status}`)}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
  },
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xs,
  },
});
