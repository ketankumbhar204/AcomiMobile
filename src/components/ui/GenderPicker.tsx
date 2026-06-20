import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MemberGender } from '../../api/types';
import { MEMBER_GENDER_OPTIONS, memberGenderLabelKey } from '../../utils/memberGender';
import { colors, radius, spacing, typography } from '../../theme';

type GenderPickerProps = {
  value: MemberGender | null;
  onChange: (gender: MemberGender) => void;
  error?: string | null;
  required?: boolean;
};

export function GenderPicker({ value, onChange, error, required = false }: GenderPickerProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        {t('membership.gender.label')}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={styles.row}>
        {MEMBER_GENDER_OPTIONS.map(option => {
          const isSelected = value === option;
          return (
            <Pressable
              key={option}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && !isSelected && styles.chipPressed,
              ]}
              onPress={() => onChange(option)}>
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {t(memberGenderLabelKey(option))}
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
  required: {
    color: '#DC2626',
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
    alignItems: 'center',
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
  errorText: {
    ...typography.caption,
    color: '#DC2626',
    marginTop: spacing.xs,
  },
});
