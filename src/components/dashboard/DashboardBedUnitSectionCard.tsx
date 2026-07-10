import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BedSpaceListItemResponse } from '../../api/types';
import { Card } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import type { BedUnitGroup } from '../../utils/groupBedsByRoom';
import { formatUnitGroupLocation } from '../../utils/groupBedsByRoom';
import type { BedInventoryFlowAction } from './DashboardBedInventoryBedRow';
import { DashboardBedInventoryBedRow } from './DashboardBedInventoryBedRow';

type BedSectionFlowProps = {
  flowAction?: BedInventoryFlowAction;
  onFlowAction?: (bed: BedSpaceListItemResponse) => void;
};

type DashboardBedUnitSectionCardProps = BedSectionFlowProps & {
  group: BedUnitGroup;
  canManageOccupancy: boolean;
  onBedPress: (bed: BedSpaceListItemResponse) => void;
  onAllocate?: (bed: BedSpaceListItemResponse) => void;
  onReserve?: (bed: BedSpaceListItemResponse) => void;
};

function DashboardBedUnitSectionCardComponent({
  group,
  canManageOccupancy,
  onBedPress,
  onAllocate,
  onReserve,
  flowAction = 'dashboard',
  onFlowAction,
}: DashboardBedUnitSectionCardProps) {
  const { t } = useTranslation();
  const location = formatUnitGroupLocation(group);
  const unitTitle = group.unitName ?? t('occupancy.section.floor');
  const totalBeds = group.rooms.reduce((sum, room) => sum + room.beds.length, 0);
  const availableBeds = group.rooms.reduce(
    (sum, room) => sum + room.beds.filter(bed => bed.status === 'AVAILABLE').length,
    0,
  );

  return (
    <Card style={styles.card}>
      <View style={styles.unitHeader}>
        <Text style={styles.unitName}>{unitTitle}</Text>
        {location ? <Text style={styles.unitLocation}>{location}</Text> : null}
        <Text style={styles.unitCount}>
          {t('dashboard.drilldown.unitBedCount', {
            count: totalBeds,
            available: availableBeds,
          })}
        </Text>
      </View>

      {group.rooms.map(room => {
        const roomAvailable = room.beds.filter(bed => bed.status === 'AVAILABLE').length;
        return (
          <View key={room.key} style={styles.roomBlock}>
            <View style={styles.roomHeader}>
              <Text style={styles.roomName}>{room.roomName}</Text>
              <Text style={styles.roomCount}>
                {t('dashboard.drilldown.roomAvailableCount', {
                  count: room.beds.length,
                  available: roomAvailable,
                })}
              </Text>
            </View>
            <View style={styles.bedList}>
              {room.beds.map((bed, bedIndex) => (
                <DashboardBedInventoryBedRow
                  key={bed.bedId}
                  bed={bed}
                  canManageOccupancy={canManageOccupancy}
                  onPress={() => onBedPress(bed)}
                  onAllocate={onAllocate ? () => onAllocate(bed) : undefined}
                  onReserve={onReserve ? () => onReserve(bed) : undefined}
                  onFlowAction={onFlowAction ? () => onFlowAction(bed) : undefined}
                  flowAction={flowAction}
                  showDivider={bedIndex > 0}
                />
              ))}
            </View>
          </View>
        );
      })}
    </Card>
  );
}

export const DashboardBedUnitSectionCard = memo(DashboardBedUnitSectionCardComponent);

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  unitHeader: {
    gap: spacing.xxs,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  unitName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  unitLocation: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  unitCount: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xxs,
  },
  roomBlock: {
    marginTop: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  roomHeader: {
    backgroundColor: colors.lightGreen,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  roomName: {
    ...typography.bodyStrong,
    fontSize: typography.h3.fontSize,
    color: colors.primaryDark,
  },
  roomCount: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  bedList: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
  },
});
