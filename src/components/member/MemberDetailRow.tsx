import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

type MemberDetailRowProps = {
  label: string;
  value: string;
  isLast?: boolean;
};

export function MemberDetailRow({ label, value, isLast = false }: MemberDetailRowProps) {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function MemberSectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xxs,
  },
  value: {
    ...typography.bodyStrong,
  },
  sectionTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.sm,
  },
});
