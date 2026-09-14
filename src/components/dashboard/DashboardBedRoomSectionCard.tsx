import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bookmark, UserPlus } from 'lucide-react-native';
import type { BedSpaceListItemResponse } from '../../api/types';
import { BuildingInventoryRoomSection } from '../accommodation/BuildingInventoryRoomSection';
import { Button } from '../ui';
import { spacing } from '../../theme';
import type { BedRoomGroup } from '../../utils/groupBedsByRoom';
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
  onAllocate?: (bed: BedSpaceListItemResponse) => void;
  onReserve?: (bed: BedSpaceListItemResponse) => void;
};

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

  return (
    <BuildingInventoryRoomSection
      group={group}
      title={formatRoomGroupPathWithBuilding(group)}
      onBedPress={bed => {
        if (flowAction !== 'dashboard' && bed.status === 'AVAILABLE' && onFlowAction) {
          onFlowAction(bed);
          return;
        }
        onBedPress(bed);
      }}
      renderBedFooter={bed => {
        const isAvailable = bed.status === 'AVAILABLE';
        if (flowAction === 'dashboard' && canManageOccupancy && isAvailable && onAllocate && onReserve) {
          return (
            <View style={styles.actions}>
              <Button
                label={t('occupancy.actions.allocate')}
                onPress={() => onAllocate(bed)}
                icon={UserPlus}
                style={styles.actionBtn}
              />
              <Button
                label={t('occupancy.actions.reserve')}
                variant="secondary"
                onPress={() => onReserve(bed)}
                icon={Bookmark}
                style={styles.actionBtn}
              />
            </View>
          );
        }
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
  actions: {
    gap: spacing.xs,
  },
  actionBtn: {
    minHeight: 36,
  },
  singleAction: {
    minHeight: 36,
  },
});
