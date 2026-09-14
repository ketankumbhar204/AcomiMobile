import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bookmark, UserPlus } from 'lucide-react-native';
import type { BedSpaceListItemResponse } from '../../api/types';
import { BuildingInventoryRoomSection } from '../accommodation/BuildingInventoryRoomSection';
import { Button } from '../ui';
import { colors, spacing, typography } from '../../theme';
import type { BedUnitGroup } from '../../utils/groupBedsByRoom';
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
          onBedPress={bed => {
            if (flowAction !== 'dashboard' && bed.status === 'AVAILABLE' && onFlowAction) {
              onFlowAction(bed);
              return;
            }
            onBedPress(bed);
          }}
          renderBedFooter={bed => {
            const isAvailable = bed.status === 'AVAILABLE';
            if (
              flowAction === 'dashboard' &&
              canManageOccupancy &&
              isAvailable &&
              onAllocate &&
              onReserve
            ) {
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
