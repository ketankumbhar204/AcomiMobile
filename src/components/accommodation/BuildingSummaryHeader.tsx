import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react-native';
import type { BuildingSummaryResponse } from '../../api/types';
import { Card, InlineEditableName, Skeleton } from '../ui';
import { colors, shadows, spacing, typography } from '../../theme';
import type { AccommodationUiProfile } from '../../utils/accommodationProfile';
import { getAccommodationHierarchyAccent } from '../../utils/accommodationHierarchy';
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
  const accent = getAccommodationHierarchyAccent('building');

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
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconWell,
            { backgroundColor: accent.soft, borderColor: accent.border },
          ]}>
          <Building2 size={20} color={accent.accent} strokeWidth={2.2} />
        </View>
        <View style={styles.copy}>
          <InlineEditableName
            value={summary.name}
            editable={editableName}
            onSave={onSaveName}
          />
          <Text style={styles.metadata}>{metadataParts.join(' · ')}</Text>
        </View>
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: 18,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  gap: {
    height: spacing.sm,
  },
  metadata: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
  actions: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
