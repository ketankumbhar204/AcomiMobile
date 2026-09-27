import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BedSpaceListItemResponse } from '../../api/types';
import { BuildingInventoryRoomSection } from '../accommodation/BuildingInventoryRoomSection';
import { Button } from '../ui';
import { colors, spacing, typography } from '../../theme';
import type { BedRoomGroup, BedUnitGroup, RoomPathCrumb } from '../../utils/groupBedsByRoom';
import { formatUnitGroupLocation } from '../../utils/groupBedsByRoom';
import type { BedInventoryFlowAction } from './DashboardBedInventoryBedRow';

type BedSectionFlowProps = {
  flowAction?: BedInventoryFlowAction;
  onFlowAction?: (bed: BedSpaceListItemResponse) => void;
};

type DashboardBedUnitSectionCardProps = BedSectionFlowProps & {
  group: BedUnitGroup;
  canManageOccupancy: boolean;
  onBedPress: (bed: BedSpaceListItemResponse) => void;
  onEditBed?: (bed: BedSpaceListItemResponse) => void;
  onAllocate?: (bed: BedSpaceListItemResponse) => void;
  onReserve?: (bed: BedSpaceListItemResponse) => void;
  onPathCrumbPress?: (room: BedRoomGroup, crumb: RoomPathCrumb) => void;
};

function DashboardBedUnitSectionCardComponent({
  group,
  canManageOccupancy: _canManageOccupancy,
  onBedPress,
  onEditBed,
  onAllocate: _onAllocate,
  onReserve: _onReserve,
  flowAction = 'dashboard',
  onFlowAction,
  onPathCrumbPress,
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
    <View style={styles.wrap}>
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

      {group.rooms.map(room => (
        <BuildingInventoryRoomSection
          key={room.key}
          group={room}
          onPathCrumbPress={
            onPathCrumbPress ? crumb => onPathCrumbPress(room, crumb) : undefined
          }
          onBedPress={bed => {
            if (flowAction !== 'dashboard' && bed.status === 'AVAILABLE' && onFlowAction) {
              onFlowAction(bed);
              return;
            }
            onBedPress(bed);
          }}
          onEditBed={flowAction === 'dashboard' ? onEditBed : undefined}
          renderBedFooter={bed => {
            const isAvailable = bed.status === 'AVAILABLE';
            if (flowAction !== 'dashboard' && isAvailable && onFlowAction) {
              const label =
                flowAction === 'allocate'
                  ? t('occupancy.actions.allocate')
                  : flowAction === 'reserve'
                    ? t('occupancy.actions.reserve')
                    : t('occupancy.actions.transfer');
              return (
                <Button label={label} onPress={() => onFlowAction(bed)} style={styles.singleAction} />
              );
            }
            return null;
          }}
        />
      ))}
    </View>
  );
}

export const DashboardBedUnitSectionCard = memo(DashboardBedUnitSectionCardComponent);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  unitHeader: {
    gap: spacing.xxs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xxs,
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
  singleAction: {
    minHeight: 36,
  },
});
