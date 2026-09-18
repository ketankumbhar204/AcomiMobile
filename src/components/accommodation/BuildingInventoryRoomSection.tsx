import React, { memo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronRight, DoorOpen, Pencil, Users } from 'lucide-react-native';
import type { BedSpaceListItemResponse } from '../../api/types';
import { colors, pastels, spacing, typography } from '../../theme';
import {
  roomGroupAvailableCount,
  roomGroupPathCrumbs,
  type BedRoomGroup,
  type RoomPathCrumb,
} from '../../utils/groupBedsByRoom';
import {
  BuildingInventoryAddBedCard,
  BuildingInventoryBedCard,
} from './BuildingInventoryBedCard';

type BuildingInventoryRoomSectionProps = {
  group: BedRoomGroup;
  /** Override path crumbs (defaults to Floor / Unit / Room). */
  pathCrumbs?: RoomPathCrumb[];
  /** Override path segments (defaults to Floor / Unit / Room). */
  pathSegments?: string[];
  /** @deprecated Prefer pathSegments. */
  title?: string;
  pricingEditable?: boolean;
  showAddBed?: boolean;
  menu?: React.ReactNode;
  onRoomPress?: () => void;
  onPathCrumbPress?: (crumb: RoomPathCrumb) => void;
  /** @deprecated Prefer consolidating hierarchy edits into `menu` (pencil trigger). */
  onEditRoom?: () => void;
  onBedPress?: (bed: BedSpaceListItemResponse) => void;
  onAddBed?: () => void;
  onCommitPricing?: (
    bed: BedSpaceListItemResponse,
    field: 'defaultRent' | 'defaultDeposit',
    value: number | null,
  ) => Promise<void>;
  renderBedMenu?: (bed: BedSpaceListItemResponse) => React.ReactNode;
  renderBedFooter?: (bed: BedSpaceListItemResponse) => React.ReactNode;
};

function BuildingInventoryRoomSectionComponent({
  group,
  pathCrumbs: pathCrumbsProp,
  pathSegments: pathSegmentsProp,
  title,
  pricingEditable = false,
  showAddBed = false,
  menu,
  onRoomPress,
  onPathCrumbPress,
  onEditRoom,
  onBedPress,
  onAddBed,
  onCommitPricing,
  renderBedMenu,
  renderBedFooter,
}: BuildingInventoryRoomSectionProps) {
  const { t } = useTranslation();
  const available = roomGroupAvailableCount(group);
  const pathCrumbs =
    pathCrumbsProp ??
    roomGroupPathCrumbs(group, {
      includeBuilding: Boolean(title) || Boolean(pathSegmentsProp?.includes(group.buildingName)),
      includeUnit: pathSegmentsProp
        ? pathSegmentsProp.some(segment => segment === group.unitName)
        : Boolean(group.unitId),
    });
  const pathSegments = pathSegmentsProp ?? pathCrumbs.map(crumb => crumb.label);
  const availabilityLabel = t('accommodation.builder.bedsAvailable', {
    available,
    total: group.beds.length,
    defaultValue: `${available}/${group.beds.length} Beds Available`,
  });
  const roomType = group.roomType ?? group.beds.find(b => b.roomType)?.roomType;
  const roomTypeLabel = roomType
    ? t(`accommodation.roomType.${roomType}`, { defaultValue: roomType })
    : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {onPathCrumbPress ? (
            <View style={styles.titleMain}>
              <Pressable
                onPress={onRoomPress}
                disabled={!onRoomPress}
                hitSlop={4}
                accessibilityRole={onRoomPress ? 'button' : undefined}>
                <View style={styles.pathIcon}>
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
                    <Pressable
                      onPress={() => onPathCrumbPress(crumb)}
                      hitSlop={4}
                      accessibilityRole="link"
                      accessibilityLabel={crumb.label}>
                      <Text style={styles.pathLink} numberOfLines={1}>
                        {crumb.label}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Pressable
              onPress={onRoomPress}
              disabled={!onRoomPress}
              style={({ pressed }) => [
                styles.titleMain,
                pressed && onRoomPress ? styles.pressed : null,
              ]}
              accessibilityRole={onRoomPress ? 'button' : undefined}>
              <View style={styles.pathIcon}>
                <DoorOpen size={16} color={pastels.purple.fg} strokeWidth={2.2} />
              </View>
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
                    <Text style={styles.path} numberOfLines={1}>
                      {pathSegments[index] ?? crumb.label}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>
          )}

          <View style={styles.titleActions}>
            {/* Hierarchy edits live under a single pencil menu to avoid truncating the path. */}
            {menu ? (
              <View style={styles.menuSlot}>{menu}</View>
            ) : onEditRoom ? (
              <Pressable
                onPress={onEditRoom}
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={t('accommodation.rooms.editTitle', {
                  defaultValue: 'Edit Room',
                })}
                hitSlop={6}>
                <Pencil size={16} color={colors.info} strokeWidth={2.4} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.availabilityPill}>
            <Text style={styles.availabilityText} numberOfLines={1}>
              {availabilityLabel}
            </Text>
          </View>
          {roomTypeLabel ? (
            <View style={styles.roomTypeRow}>
              <Users size={12} color={colors.textSecondary} strokeWidth={2.2} />
              <Text style={styles.roomTypeText} numberOfLines={1}>
                {t('accommodation.builder.roomTypeLabel', {
                  type: roomTypeLabel,
                  defaultValue: `${roomTypeLabel} Room`,
                })}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bedsRow}
        decelerationRate="fast"
        nestedScrollEnabled>
        {group.beds.map(bed => (
          <BuildingInventoryBedCard
            key={bed.bedId}
            bed={bed}
            pricingEditable={pricingEditable}
            onPress={onBedPress ? () => onBedPress(bed) : undefined}
            onCommitPricing={
              onCommitPricing
                ? (field, value) => onCommitPricing(bed, field, value)
                : undefined
            }
            menu={renderBedMenu?.(bed)}
            footer={renderBedFooter?.(bed)}
          />
        ))}
        {showAddBed && onAddBed ? <BuildingInventoryAddBedCard onPress={onAddBed} /> : null}
      </ScrollView>
    </View>
  );
}

export const BuildingInventoryRoomSection = memo(BuildingInventoryRoomSectionComponent);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  header: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  titleMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.85,
  },
  pathIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
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
  path: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.textPrimary,
  },
  pathLink: {
    ...typography.bodyStrong,
    fontSize: 14,
    color: colors.info,
    textDecorationLine: 'underline',
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
    marginTop: 0,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  menuSlot: {
    marginRight: -4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 40,
  },
  availabilityPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.lightGreen,
    borderWidth: 1,
    borderColor: '#C6EBD7',
  },
  availabilityText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  roomTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomTypeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  bedsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
});
