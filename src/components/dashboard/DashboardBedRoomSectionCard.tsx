import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BedSpaceListItemResponse } from '../../api/types';
import { BuildingInventoryRoomSection } from '../accommodation/BuildingInventoryRoomSection';
import { Button } from '../ui';
import { spacing } from '../../theme';
import type { BedRoomGroup, RoomPathCrumb } from '../../utils/groupBedsByRoom';
import { formatRoomGroupPathWithBuilding } from '../../utils/groupBedsByRoom';
import type { BedInventoryFlowAction } from './DashboardBedInventoryBedRow';

type BedSectionFlowProps = {
  flowAction?: BedInventoryFlowAction;
  onFlowAction?: (bed: BedSpaceListItemResponse) => void;
};

type DashboardBedRoomSectionCardProps = BedSectionFlowProps & {
  group: BedRoomGroup;
  canManageOccupancy: boolean;
  onBedPress: (bed: BedSpaceListItemResponse) => void;
  onEditBed?: (bed: BedSpaceListItemResponse) => void;
  onAllocate?: (bed: BedSpaceListItemResponse) => void;
  onReserve?: (bed: BedSpaceListItemResponse) => void;
  onPathCrumbPress?: (crumb: RoomPathCrumb) => void;
};

function DashboardBedRoomSectionCardComponent({
  group,
  canManageOccupancy: _canManageOccupancy,
  onBedPress,
  onEditBed,
  onAllocate: _onAllocate,
  onReserve: _onReserve,
  flowAction = 'dashboard',
  onFlowAction,
  onPathCrumbPress,
}: DashboardBedRoomSectionCardProps) {
  const { t } = useTranslation();

  return (
    <BuildingInventoryRoomSection
      group={group}
      title={formatRoomGroupPathWithBuilding(group)}
      onPathCrumbPress={onPathCrumbPress}
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
  );
}

export const DashboardBedRoomSectionCard = memo(DashboardBedRoomSectionCardComponent);

const styles = StyleSheet.create({
  singleAction: {
    minHeight: 36,
  },
});
