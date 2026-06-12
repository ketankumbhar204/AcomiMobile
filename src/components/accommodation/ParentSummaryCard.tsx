import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui';
import { colors, spacing, typography } from '../../theme';

type ParentSummaryCardProps = {
  roomCount?: number;
  bedCount?: number;
  loading?: boolean;
};

export function ParentSummaryCard({ roomCount, bedCount, loading }: ParentSummaryCardProps) {
  const { t } = useTranslation();

  if (loading) {
    return null;
  }

  const parts: string[] = [];
  if (roomCount != null) {
    parts.push(t('accommodation.overview.summaryRooms', { count: roomCount }));
  }
  if (bedCount != null) {
    parts.push(t('accommodation.overview.summaryBeds', { count: bedCount }));
  }

  if (parts.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.label}>{t('accommodation.overview.parentSummary')}</Text>
      <Text style={styles.value}>{parts.join(' · ')}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
