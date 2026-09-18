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
import { EntityPhoto } from '../files/EntityPhoto';
import { calcOccupancyPercent } from './layout/cards/occupancyUtils';

type BuildingSummaryHeaderProps = {
  summary: BuildingSummaryResponse | null;
  profile: AccommodationUiProfile;
  loading?: boolean;
  editableName?: boolean;
  spaceId?: string;
  canEditPhoto?: boolean;
  onPhotoChanged?: (fileId: string | null) => void;
  onSaveName?: (name: string) => Promise<void>;
  actions?: React.ReactNode;
};

export function BuildingSummaryHeader({
  summary,
  profile: _profile,
  loading,
  editableName = false,
  spaceId,
  canEditPhoto = false,
  onPhotoChanged,
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

  const availableBeds = summary.availableBeds ?? summary.available;
  const occupiedBeds = summary.occupiedBeds ?? summary.occupied;
  const totalBeds = summary.beds || availableBeds + occupiedBeds;
  const occupancyPercent = calcOccupancyPercent(occupiedBeds, totalBeds);

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconWell,
            { backgroundColor: accent.soft, borderColor: accent.border },
          ]}>
          {spaceId ? (
            <EntityPhoto
              spaceId={spaceId}
              entityId={summary.buildingId}
              kind="building"
              fileId={summary.photoFileId}
              canEdit={canEditPhoto}
              size={42}
              title={summary.name}
              onChanged={onPhotoChanged}
              fallback={<Building2 size={20} color={accent.accent} strokeWidth={2.2} />}
            />
          ) : (
            <Building2 size={20} color={accent.accent} strokeWidth={2.2} />
          )}
        </View>
        <View style={styles.copy}>
          <InlineEditableName
            value={summary.name}
            editable={editableName}
            onSave={onSaveName}
          />
          <Text style={styles.metadata}>
            {t(getLayoutModeLabelKey(summary.layoutMode))}
          </Text>
          <Text style={styles.counts}>
            {t('accommodation.builder.summaryCounts', {
              floors: summary.floors,
              rooms: summary.rooms,
              beds: summary.beds,
              defaultValue: `${summary.floors} Floors · ${summary.rooms} Rooms · ${summary.beds} Beds`,
            })}
          </Text>
        </View>
        {totalBeds > 0 ? (
          <View style={styles.ringWrap}>
            <CircularOccupancyIndicator percent={occupancyPercent} size={56} />
            <Text style={styles.availableLabel}>
              {t('accommodation.builder.availableOfTotal', {
                available: availableBeds,
                total: totalBeds,
                defaultValue: `${availableBeds}/${totalBeds} Available`,
              })}
            </Text>
          </View>
        ) : null}
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
  counts: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ringWrap: {
    alignItems: 'center',
    gap: 4,
    maxWidth: 88,
  },
  availableLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
