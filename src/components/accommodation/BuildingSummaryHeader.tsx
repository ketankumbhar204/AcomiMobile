import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Building2, Grid2x2 } from 'lucide-react-native';
import type { BuildingSummaryResponse } from '../../api/types';
import { Card, InlineEditableName, Skeleton } from '../ui';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import {
  visibleBuildingSummaryParts,
  type AccommodationUiProfile,
} from '../../utils/accommodationProfile';
import { getAccommodationHierarchyAccent } from '../../utils/accommodationHierarchy';
import { getLayoutModeLabelKey } from '../../utils/propertyLayoutMode';
import { EntityPhoto } from '../files/EntityPhoto';
import { getBuildingIllustration } from './layout/illustrations/illustrationAssets';
import { CircularOccupancyIndicator } from './layout/cards/CircularOccupancyIndicator';
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
  /** Space-type name for rental and corporate stay. Other types keep the layout label. */
  typeLabel?: string;
  /** Building active flag when the buildings list has loaded. */
  active?: boolean;
};

export function BuildingSummaryHeader({
  summary,
  profile,
  loading,
  editableName = false,
  spaceId,
  canEditPhoto = false,
  onPhotoChanged,
  onSaveName,
  actions,
  typeLabel,
  active,
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
  const summaryParts = visibleBuildingSummaryParts(profile);
  const countsText =
    summaryParts === 'combinedFloorsRoomsBeds'
      ? t('accommodation.builder.summaryCounts', {
          floors: summary.floors,
          rooms: summary.rooms,
          beds: summary.beds,
          defaultValue: `${summary.floors} Floors · ${summary.rooms} Rooms · ${summary.beds} Beds`,
        })
      : summaryParts
          .map(part => {
            if (part === 'floors') {
              return t('accommodation.builder.summaryFloors', {
                count: summary.floors,
                defaultValue: '{{count}} Floors',
              });
            }
            if (part === 'units') {
              return t('accommodation.builder.summaryUnits', {
                count: summary.visibleUnitCount,
                defaultValue: '{{count}} Units',
              });
            }
            if (part === 'rooms') {
              return t('accommodation.builder.summaryRooms', {
                count: summary.rooms,
                defaultValue: '{{count}} Rooms',
              });
            }
            return t('accommodation.builder.summaryBeds', {
              count: summary.beds,
              defaultValue: '{{count}} Beds',
            });
          })
          .join(' · ');

  if (profile.layoutMode === 'RENTAL') {
    const photo = (
      <Image
        source={getBuildingIllustration()}
        style={styles.rentalPhotoArt}
        resizeMode="contain"
        fadeDuration={0}
      />
    );
    return (
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.rentalPhoto}>
            {spaceId ? (
              <EntityPhoto
                spaceId={spaceId}
                entityId={summary.buildingId}
                kind="building"
                fileId={summary.photoFileId}
                canEdit={canEditPhoto}
                fill
                width={76}
                height={64}
                title={summary.name}
                onChanged={onPhotoChanged}
                fallback={photo}
              />
            ) : (
              photo
            )}
          </View>
          <View style={styles.copy}>
            <InlineEditableName
              value={summary.name}
              editable={editableName}
              onSave={onSaveName}
            />
            <Text style={styles.rentalType}>
              {typeLabel ?? t(getLayoutModeLabelKey(summary.layoutMode))}
            </Text>
          </View>
          {active == null ? null : (
            <View style={[styles.activePill, !active && styles.inactivePill]}>
              <View style={[styles.activeDot, !active && styles.inactiveDot]} />
              <Text style={[styles.activeText, !active && styles.inactiveText]}>
                {active
                  ? t('accommodation.active', { defaultValue: 'Active' })
                  : t('accommodation.builder.inactive', { defaultValue: 'Inactive' })}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.countRow}>
          <CountChip
            icon={Grid2x2}
            label={t('accommodation.builder.summaryUnits', {
              count: summary.visibleUnitCount,
              defaultValue: '{{count}} Units',
            })}
          />
        </View>
        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </Card>
    );
  }

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
              fallback={
                <Image
                  source={getBuildingIllustration()}
                  style={styles.photoArt}
                  resizeMode="contain"
                  fadeDuration={0}
                />
              }
            />
          ) : (
            <Image
              source={getBuildingIllustration()}
              style={styles.photoArt}
              resizeMode="contain"
              fadeDuration={0}
            />
          )}
        </View>
        <View style={styles.copy}>
          <InlineEditableName
            value={summary.name}
            editable={editableName}
            onSave={onSaveName}
          />
          <Text style={styles.metadata}>
            {typeLabel ?? t(getLayoutModeLabelKey(summary.layoutMode))}
          </Text>
          {countsText ? <Text style={styles.counts}>{countsText}</Text> : null}
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

function CountChip({
  icon: Icon,
  label,
}: {
  icon: typeof Building2;
  label: string;
}) {
  return (
    <View style={styles.countChip}>
      <Icon size={14} color={colors.textSecondary} strokeWidth={2.2} />
      <Text style={styles.countChipText}>{label}</Text>
    </View>
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
  photoArt: {
    width: 42,
    height: 42,
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
  rentalPhoto: {
    width: 76,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.mintSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rentalPhotoArt: {
    width: 68,
    height: 52,
  },
  rentalType: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.lightGreen,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  inactivePill: {
    backgroundColor: colors.surfaceSecondary,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    backgroundColor: colors.muted,
  },
  activeText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  inactiveText: {
    color: colors.textSecondary,
  },
  countRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countChipText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
