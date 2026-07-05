import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BuildingSummaryResponse } from '../../api/types';
import { Card, InlineEditableName, Skeleton } from '../ui';
import { colors, spacing, typography } from '../../theme';
import type { AccommodationUiProfile } from '../../utils/accommodationProfile';
import { getLayoutModeLabelKey } from '../../utils/propertyLayoutMode';

type BuildingSummaryHeaderProps = {
  summary: BuildingSummaryResponse | null;
  profile: AccommodationUiProfile;
  loading?: boolean;
  editableName?: boolean;
  onSaveName?: (name: string) => Promise<void>;
  actions?: React.ReactNode;
};

export function BuildingSummaryHeader({
  summary,
  profile: _profile,
  loading,
  editableName = false,
  onSaveName,
  actions,
}: BuildingSummaryHeaderProps) {
  const { t } = useTranslation();

  if (loading && !summary) {
    return (
      <Card style={styles.card}>
        <Skeleton width="60%" height={20} />
        <View style={styles.gap} />
        <Skeleton width="80%" height={14} />
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const metadataParts: string[] = [];
  if (summary.code) {
    metadataParts.push(summary.code);
  }
  metadataParts.push(t(getLayoutModeLabelKey(summary.layoutMode)));

  return (
    <Card style={styles.card}>
      <InlineEditableName
        value={summary.name}
        editable={editableName}
        onSave={onSaveName}
      />
      <Text style={styles.metadata}>{metadataParts.join(' · ')}</Text>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  gap: {
    height: spacing.sm,
  },
  metadata: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
