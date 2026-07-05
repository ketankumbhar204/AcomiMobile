import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Card, InlineEditableName, Skeleton } from '../ui';
import { colors, spacing, typography } from '../../theme';

type AccommodationMetadataCardProps = {
  title: string;
  subtitle?: string;
  loading?: boolean;
  editableName?: boolean;
  onSaveName?: (name: string) => Promise<void>;
};

export function AccommodationMetadataCard({
  title,
  subtitle,
  loading,
  editableName = false,
  onSaveName,
}: AccommodationMetadataCardProps) {
  if (loading) {
    return (
      <Card style={styles.card}>
        <Skeleton width="50%" height={20} />
        <View style={styles.gap} />
        <Skeleton width="70%" height={14} />
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      {editableName && onSaveName ? (
        <InlineEditableName value={title} editable onSave={onSaveName} />
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  gap: {
    marginTop: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
