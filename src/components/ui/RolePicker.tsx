import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MembershipRole } from '../../api/types';
import { colors, radius, spacing, typography } from '../../theme';

const ROLES: { value: MembershipRole; label: string; description: string }[] = [
  { value: 'TENANT', label: 'Tenant', description: 'Stays in the PG / Hostel' },
  { value: 'CUSTOMER', label: 'Customer', description: 'Uses mess / co-living' },
  { value: 'STAFF', label: 'Staff', description: 'Works at this space' },
  { value: 'MANAGER', label: 'Manager', description: 'Helps manage the space' },
];

type RolePickerProps = {
  value: MembershipRole | null;
  onChange: (role: MembershipRole) => void;
  error?: string | null;
};

export function RolePicker({ value, onChange, error }: RolePickerProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Role</Text>
      <View style={styles.grid}>
        {ROLES.map(item => {
          const isSelected = value === item.value;
          return (
            <Pressable
              key={item.value}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && !isSelected && styles.chipPressed,
              ]}
              onPress={() => onChange(item.value)}>
              <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
                {item.label}
              </Text>
              <Text style={[styles.chipDesc, isSelected && styles.chipDescSelected]}>
                {item.description}
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
