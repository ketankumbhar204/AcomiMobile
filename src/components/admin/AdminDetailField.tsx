import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui';
import { colors, spacing, typography } from '../../theme';

type AdminDetailFieldProps = {
  label: string;
  value: string;
};

export function AdminDetailField({ label, value }: AdminDetailFieldProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

type AdminDetailSectionProps = {
  children: React.ReactNode;
};

export function AdminDetailSection({ children }: AdminDetailSectionProps) {
  return <Card style={styles.section}>{children}</Card>;
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  row: {
    gap: 2,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  value: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
