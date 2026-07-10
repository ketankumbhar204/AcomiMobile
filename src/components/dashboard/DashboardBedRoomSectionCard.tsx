import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BedSpaceListItemResponse } from '../../api/types';
import { Card } from '../ui';
import { colors, radius, spacing, typography } from '../../theme';
import type { BedRoomGroup } from '../../utils/groupBedsByRoom';
import type { BedInventoryFlowAction } from './DashboardBedInventoryBedRow';
import { DashboardBedInventoryBedRow } from './DashboardBedInventoryBedRow';

type BedSectionFlowProps = {
  flowAction?: BedInventoryFlowAction;
  onFlowAction?: (bed: BedSpaceListItemResponse) => void;
};

type DashboardBedRoomSectionCardProps = BedSectionFlowProps & {
  group: BedRoomGroup;
  canManageOccupancy: boolean;
  onBedPress: (bed: BedSpaceListItemResponse) => void;
  onAllocate?: (bed: BedSpaceListItemResponse) => void;
  onReserve?: (bed: BedSpaceListItemResponse) => void;
};

function formatRoomSectionLocation(group: BedRoomGroup): string {
  return [group.floorName, group.buildingName].filter(Boolean).join(' · ');
}

function DashboardBedRoomSectionCardComponent({
  group,
  canManageOccupancy,
  onBedPress,
  onAllocate,
  onReserve,
  flowAction = 'dashboard',
  onFlowAction,
}: DashboardBedRoomSectionCardProps) {
  const { t } = useTranslation();
  const location = formatRoomSectionLocation(group);
  const availableBeds = group.beds.filter(bed => bed.status === 'AVAILABLE').length;

  return (
    <Card style={styles.card}>
      <View style={styles.roomHeader}>
        <Text style={styles.roomName}>{group.roomName}</Text>
        {location ? <Text style={styles.roomLocation}>{location}</Text> : null}
        <Text style={styles.roomCount}>
          {t('dashboard.drilldown.roomAvailableCount', {
            count: group.beds.length,
            available: availableBeds,
          })}
        </Text>
      </View>
      <View style={styles.bedList}>
        {group.beds.map((bed, bedIndex) => (
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
    </Card>
  );
}

export const DashboardBedRoomSectionCard = memo(DashboardBedRoomSectionCardComponent);

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
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
  roomLocation: {
    ...typography.caption,
    color: colors.textSecondary,
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
