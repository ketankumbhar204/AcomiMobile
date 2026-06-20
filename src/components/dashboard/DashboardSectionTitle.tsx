import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

type DashboardSectionTitleProps = {
  title: string;
};

export function DashboardSectionTitle({ title }: DashboardSectionTitleProps) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
});
