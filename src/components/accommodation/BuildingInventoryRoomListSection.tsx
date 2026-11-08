import React, { memo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, DoorOpen } from 'lucide-react-native';
import type { BedSpaceListItemResponse } from '../../api/types';
import { useBedOccupantLabel } from '../../hooks/useBedOccupantLabel';
import { colors, pastels, radius, shadows, spacing, typography } from '../../theme';
import { formatBedDisplayLabel } from '../../utils/formatBedDisplayLabel';
import {
  roomGroupPathCrumbs,
  type BedRoomGroup,
  type RoomPathCrumb,
} from '../../utils/groupBedsByRoom';
import { getAccommodationStatusColor } from '../../utils/accommodationStatus';
import { useOccupiedBedStay } from '../../hooks/useOccupiedBedStay';
import { getBedIllustration } from './layout/illustrations/illustrationAssets';
import { StayTypeBadge } from './StayTypeBadge';

type BuildingInventoryRoomListSectionProps = {
  group: BedRoomGroup;
  spaceId: string;
  /** Same hierarchy crumbs as Layout view (Building > Floor > Unit > Room). */
  pathCrumbs?: RoomPathCrumb[];
  menu?: React.ReactNode;
  onRoomPress?: () => void;
  onPathCrumbPress?: (crumb: RoomPathCrumb) => void;
  onBedPress?: (bed: BedSpaceListItemResponse) => void;
};

function BedListRow({
  bed,
  spaceId,
  onPress,
  isLast,
}: {
  bed: BedSpaceListItemResponse;
  spaceId: string;
  onPress?: () => void;
  isLast: boolean;
}) {
  const { t } = useTranslation();
  const displayLabel = formatBedDisplayLabel(bed.label, t);
  const occupantLabel = useBedOccupantLabel(spaceId, bed.bedId, bed.status);
  const showStayLookup = bed.status === 'OCCUPIED' || bed.status === 'RESERVED';
  const occupiedStay = useOccupiedBedStay(spaceId, bed.bedId, showStayLookup);
  const accent = getAccommodationStatusColor(bed.status);
  const statusLabel = t(`accommodation.status.${bed.status}`, {
    defaultValue: bed.status,
  });

  let detailPrimary = '—';
  let detailSecondary = statusLabel;
  if (bed.status === 'OCCUPIED') {
    detailPrimary = occupantLabel?.trim() || '—';
    detailSecondary = occupantLabel
      ? t('accommodation.builder.occupiedSinceUnknown', {
          defaultValue: 'Occupied',
        })
      : t('accommodation.builder.notYetBilled', {
          defaultValue: 'Not yet billed',
        });
  } else if (bed.status === 'RESERVED') {
    detailPrimary = occupantLabel?.trim() || '—';
    detailSecondary = t('accommodation.status.RESERVED', { defaultValue: 'Reserved' });
  } else if (bed.status === 'AVAILABLE') {
    detailPrimary = t('accommodation.status.AVAILABLE', { defaultValue: 'Available' });
    detailSecondary = t('accommodation.builder.readyToAllocate', {
      defaultValue: 'Ready to allocate',
    });
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.bedRow,
        !isLast && styles.bedRowDivider,
        pressed && onPress ? styles.pressed : null,
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${displayLabel}, ${statusLabel}`}>
      <View style={[styles.bedIconWrap, { backgroundColor: `${accent}18` }]}>
        <Image
          source={getBedIllustration(bed.status)}
          style={styles.bedArt}
          resizeMode="contain"
          fadeDuration={0}
        />
      </View>
      <View style={styles.bedCopy}>
        <Text style={styles.bedName} numberOfLines={1}>
          {displayLabel}
        </Text>
        {showStayLookup ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.badgeRow}>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: `${accent}18`, borderColor: `${accent}44` },
              ]}>
              <View style={[styles.statusDot, { backgroundColor: accent }]} />
              <Text style={[styles.statusText, { color: accent }]} numberOfLines={1}>
                {statusLabel}
              </Text>
            </View>
            <StayTypeBadge stayKind={occupiedStay.occupancy?.stayKind} />
          </ScrollView>
        ) : (
          <View
            style={[
              styles.statusPill,
              { backgroundColor: `${accent}18`, borderColor: `${accent}44` },
            ]}>
            <View style={[styles.statusDot, { backgroundColor: accent }]} />
            <Text style={[styles.statusText, { color: accent }]} numberOfLines={1}>
              {statusLabel}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.occupantCol}>
        <Text style={styles.occupantName} numberOfLines={1}>
          {detailPrimary}
        </Text>
        <Text style={styles.occupantMeta} numberOfLines={1}>
          {detailSecondary}
        </Text>
      </View>
      {onPress ? <ChevronRight size={16} color={colors.muted} strokeWidth={2.4} /> : null}
    </Pressable>
  );
}

function BuildingInventoryRoomListSectionComponent({
  group,
  spaceId,
  pathCrumbs: pathCrumbsProp,
  menu,
  onRoomPress,
  onPathCrumbPress,
  onBedPress,
}: BuildingInventoryRoomListSectionProps) {
  const pathCrumbs =
    pathCrumbsProp ??
    roomGroupPathCrumbs(group, {
      includeBuilding: true,
      includeUnit: Boolean(group.unitId),
    });

  return (
    <View style={styles.card}>
      <View style={styles.roomHeader}>
        <Pressable
          onPress={onRoomPress}
          disabled={!onRoomPress}
          hitSlop={4}
          accessibilityRole={onRoomPress ? 'button' : undefined}
          accessibilityLabel={group.roomName}>
          <View style={styles.roomIcon}>
            <DoorOpen size={16} color={pastels.purple.fg} strokeWidth={2.2} />
          </View>
        </Pressable>
        <View style={styles.pathRow}>
          {pathCrumbs.map((crumb, index) => (
            <View key={`${crumb.level}-${crumb.label}`} style={styles.pathPart}>
              {index > 0 ? (
                <ChevronRight
                  size={14}
                  color={colors.muted}
                  strokeWidth={2.4}
                  style={styles.pathChevron}
                />
              ) : null}
              {onPathCrumbPress ? (
                <Pressable
                  onPress={() => onPathCrumbPress(crumb)}
                  hitSlop={4}
                  accessibilityRole="link"
                  accessibilityLabel={crumb.label}>
                  <Text style={styles.pathLink}>{crumb.label}</Text>
                </Pressable>
              ) : (
                <Text style={styles.pathPlain}>{crumb.label}</Text>
              )}
            </View>
          ))}
        </View>
        {menu ? <View style={styles.menuSlot}>{menu}</View> : null}
      </View>

      {group.beds.map((bed, index) => (
        <BedListRow
          key={bed.bedId}
          bed={bed}
          spaceId={spaceId}
          isLast={index === group.beds.length - 1}
          onPress={onBedPress ? () => onBedPress(bed) : undefined}
        />
      ))}
    </View>
  );
}

export const BuildingInventoryRoomListSection = memo(
  BuildingInventoryRoomListSectionComponent,
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FAFBFC',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    minHeight: 52,
  },
  roomIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: pastels.purple.bg,
    borderWidth: 1,
    borderColor: pastels.purple.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pathRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 4,
  },
  pathPart: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
  },
  pathChevron: {
    marginHorizontal: 4,
  },
  pathLink: {
    ...typography.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
    color: colors.info,
    textDecorationLine: 'underline',
  },
  pathPlain: {
    ...typography.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  menuSlot: {
    marginLeft: 2,
    flexShrink: 0,
  },
  bedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 64,
  },
  bedRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    opacity: 0.92,
  },
  bedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bedArt: {
    width: 22,
    height: 22,
  },
  bedCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  bedName: {
    ...typography.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 6,
    paddingRight: 2,
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '700',
  },
  occupantCol: {
    maxWidth: 112,
    alignItems: 'flex-end',
    gap: 2,
  },
  occupantName: {
    ...typography.caption,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  occupantMeta: {
    ...typography.caption,
    fontSize: 11,
    lineHeight: 14,
    color: colors.muted,
    textAlign: 'right',
  },
});
