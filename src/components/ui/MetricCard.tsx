import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { Card } from './Card';

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  hintPositive?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
};

export function MetricCard({
  label,
  value,
  hint,
  hintPositive,
  style,
  children,
}: MetricCardProps) {
  return (
    <Card style={style}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {hint ? (
        <Text
          style={[
            styles.hint,
            hintPositive ? styles.hintPositive : undefined,
          ]}>
          {hint}
        </Text>
      ) : null}
      {children}
    </Card>
  );
}

export function MetricCardProgress({ percent }: { percent: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${percent}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  hint: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  hintPositive: {
    color: colors.success,
  },
  progressTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.lightGreen,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
});
