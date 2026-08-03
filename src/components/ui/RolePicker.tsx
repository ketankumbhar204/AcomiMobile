import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MembershipRole, SpaceType } from '../../api/types';
import { assignableRolesForSpaceType } from '../../utils/memberRoles';
import { colors, radius, spacing, typography } from '../../theme';

const ALL_ROLES: MembershipRole[] = ['TENANT', 'CUSTOMER', 'STAFF', 'MANAGER'];

type RolePickerProps = {
  value: MembershipRole | null;
  onChange: (role: MembershipRole) => void;
  error?: string | null;
  spaceType?: SpaceType;
};

export function RolePicker({ value, onChange, error, spaceType }: RolePickerProps) {
  const { t } = useTranslation();

  const roles = useMemo(
    () => assignableRolesForSpaceType(spaceType).filter(role => ALL_ROLES.includes(role)),
    [spaceType],
  );

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{t('membership.roles.label')}</Text>
      <View style={styles.grid}>
        {roles.map(role => {
          const isSelected = value === role;
          const descriptionKey =
            spaceType === 'MESS' && role === 'CUSTOMER'
              ? 'membership.roles.customer.descriptionMess'
              : `membership.roles.${role.toLowerCase()}.description`;
          return (
            <Pressable
              key={role}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && !isSelected && styles.chipPressed,
              ]}
              onPress={() => onChange(role)}>
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {t(`membership.roles.${role.toLowerCase()}.label`)}
              </Text>
              <Text style={[styles.chipDesc, isSelected && styles.chipDescSelected]}>
                {t(descriptionKey)}
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
    backgroundColor: colors.surfaceSecondary,
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
