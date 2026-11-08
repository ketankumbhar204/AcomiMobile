import React, { memo, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  BedDouble,
  Building2,
  Check,
  DoorOpen,
  Layers,
  Pencil,
} from 'lucide-react-native';
import type { SpaceType } from '../../api/types';
import { EntityPhoto } from '../files/EntityPhoto';
import { canEditEntityPhoto } from '../../files/entityPhoto';
import { resolveListingCover } from '../../utils/representativeImage';
import {
  computeAvailabilityPercent,
  resolveInventoryTotal,
} from '../../utils/dashboardAvailability';
import { colors, pastels, radius, shadows, spacing, typography } from '../../theme';
import { HealthScoreRing } from './HealthScoreRing';

export type DashboardPropertyOverviewCardProps = {
  spaceId: string;
  spaceName: string;
  spaceType: SpaceType | null | undefined;
  spaceTypeLabel: string;
  photoFileId?: string | null;
  membershipRole?: string | null;
  isActive?: boolean;
  floors: number;
  rooms: number;
  beds: number;
  /** Unit-level spaces show units instead of beds in the metric strip. */
  occupancyEntity?: 'beds' | 'units';
  units?: number;
  occupied: number;
  available: number;
  reserved: number;
  onEditPress?: () => void;
  onPress?: () => void;
};

export const DashboardPropertyOverviewCard = memo(function DashboardPropertyOverviewCard({
  spaceId,
  spaceName,
  spaceType,
  spaceTypeLabel,
  photoFileId,
  membershipRole,
  isActive = true,
  floors,
  rooms,
  beds,
  occupancyEntity = 'beds',
  units = 0,
  occupied,
  available,
  reserved,
  onEditPress,
  onPress,
}: DashboardPropertyOverviewCardProps) {
  const { t } = useTranslation();
  const unitLevel = occupancyEntity === 'units';
  const structureTotal = unitLevel ? units : beds;
  const total = resolveInventoryTotal({
    structureTotal,
    occupied,
    available,
    reserved,
  });
  const availabilityPct = computeAvailabilityPercent(available, total);
  const canEditPhoto = canEditEntityPhoto(membershipRole);
  const cover = useMemo(
    () =>
      resolveListingCover({
        listingId: spaceId,
        spaceType: spaceType ?? undefined,
      }),
    [spaceId, spaceType],
  );

  const metricItems = unitLevel
    ? [
        {
          key: 'floors',
          icon: Layers,
          value: floors,
          label: t('dashboard.propertyOverview.floors', {
            count: floors,
            defaultValue: '{{count}} Floors',
          }),
        },
        {
          key: 'units',
          icon: Building2,
          value: units,
          label: t('dashboard.propertyOverview.units', {
            count: units,
            defaultValue: '{{count}} Units',
          }),
        },
      ]
    : [
        {
          key: 'floors',
          icon: Layers,
          value: floors,
          label: t('dashboard.propertyOverview.floors', {
            count: floors,
            defaultValue: '{{count}} Floors',
          }),
        },
        {
          key: 'rooms',
          icon: DoorOpen,
          value: rooms,
          label: t('dashboard.propertyOverview.rooms', {
            count: rooms,
            defaultValue: '{{count}} Rooms',
          }),
        },
        {
          key: 'beds',
          icon: BedDouble,
          value: beds,
          label: t('dashboard.propertyOverview.beds', {
            count: beds,
            defaultValue: '{{count}} Beds',
          }),
        },
      ];

  const fallbackImage = (
    <Image source={cover.source} style={styles.coverImage} resizeMode="cover" />
  );

  const body = (
    <>
      <View style={styles.coverWrap}>
        <EntityPhoto
          spaceId={spaceId}
          entityId={spaceId}
          kind="space"
          fileId={photoFileId}
          canEdit={canEditPhoto}
          fallback={fallbackImage}
          fill
          width={72}
          height={72}
          resizeMode="cover"
        />
      </View>

      <View style={styles.main}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {spaceName}
          </Text>
          {onEditPress ? (
            <Pressable
              onPress={onEditPress}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.edit')}
              style={styles.editBtn}>
              <Pencil size={14} color={colors.muted} strokeWidth={2.2} />
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.typeLabel} numberOfLines={1}>
          {spaceTypeLabel}
        </Text>
        <View style={styles.metricsRow}>
          {metricItems.map(item => {
            const Icon = item.icon;
            return (
              <View key={item.key} style={styles.metric}>
                <Icon size={12} color={colors.muted} strokeWidth={2.2} />
                <Text style={styles.metricText} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
        <View
          style={[
            styles.statusPill,
            isActive ? styles.statusActive : styles.statusInactive,
          ]}>
          {isActive ? (
            <Check size={11} color={pastels.green.fg} strokeWidth={2.6} />
          ) : null}
          <Text
            style={[
              styles.statusText,
              isActive ? styles.statusTextActive : styles.statusTextInactive,
            ]}>
            {isActive
              ? t('dashboard.propertyOverview.active', { defaultValue: 'Active' })
              : t('dashboard.propertyOverview.inactive', { defaultValue: 'Inactive' })}
          </Text>
        </View>
      </View>

      <View style={styles.ringCol}>
        <HealthScoreRing
          score={availabilityPct}
          color={colors.primary}
          size={58}
          strokeWidth={5}
        />
        <Text style={styles.availableCaption} numberOfLines={2}>
          {t('dashboard.propertyOverview.availableOfTotal', {
            available,
            total,
            defaultValue: '{{available}} / {{total}} Available',
          })}
        </Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${spaceName}. ${availabilityPct}% available`}>
        {body}
      </Pressable>
    );
  }

  return (
    <View
      style={styles.card}
      accessibilityRole="summary"
      accessibilityLabel={`${spaceName}. ${availabilityPct}% available`}>
      {body}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.section,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  pressed: {
    opacity: 0.94,
  },
  coverWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    ...typography.bodyStrong,
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  editBtn: {
    padding: 2,
  },
  typeLabel: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 15,
    color: colors.muted,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 2,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  metricText: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 2,
  },
  statusActive: {
    backgroundColor: pastels.green.bg,
  },
  statusInactive: {
    backgroundColor: colors.surface,
  },
  statusText: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
  },
  statusTextActive: {
    color: pastels.green.fg,
  },
  statusTextInactive: {
    color: colors.muted,
  },
  ringCol: {
    alignItems: 'center',
    width: 78,
    gap: 4,
  },
  availableCaption: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
    color: colors.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
});
