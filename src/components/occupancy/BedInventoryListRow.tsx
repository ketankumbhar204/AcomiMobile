import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BedListItemResponse, SpaceType } from '../../api/types';
import { InventoryListingCard } from '../accommodation/InventoryListingCard';
import { BedPricingDisplay } from '../accommodation/BedPricingDisplay';
import { BuilderRowLifecycleMenu } from '../accommodation/BuilderRowLifecycleMenu';
import type { BuilderRowLifecycleMenuProps } from '../accommodation/BuilderRowLifecycleMenu';
import { useBedOccupantLabel } from '../../hooks/useBedOccupantLabel';
import type { useAccommodationOccupancyFlow } from '../../hooks/useAccommodationOccupancyFlow';
import { spacing } from '../../theme';
import { isAccommodationEntityActive } from '../../utils/accommodationEntityActive';
import { formatBedDisplayLabel } from '../../utils/formatBedDisplayLabel';
import { buildBedOccupancyMenuOptions } from '../../utils/bedOccupancyMenuOptions';
import { buildBedOccupancyTarget } from '../../utils/buildOccupancyTarget';
import { occupancyPercentFromStatus } from '../accommodation/layout/cards/occupancyUtils';

type FlowController = ReturnType<typeof useAccommodationOccupancyFlow>;

type BedInventoryListRowProps = {
  bed: BedListItemResponse;
  spaceId: string;
  spaceType: SpaceType;
  flow: FlowController;
  buildingId: string;
  buildingName?: string;
  roomId: string;
  roomName: string;
  floorId?: string;
  unitId?: string;
  parentName?: string;
  parentType?: 'floor' | 'unit';
  currentRole?: BuilderRowLifecycleMenuProps['role'];
  canManageLifecycle?: boolean;
  canManageOccupancyActions?: boolean;
  onEdit?: () => void;
  onPress: () => void;
  lifecycleMenuProps: Omit<
    BuilderRowLifecycleMenuProps,
    'prependOptions' | 'sheetTitle' | 'forceShowTrigger'
  >;
};

export function BedInventoryListRow({
  bed,
  spaceId,
  spaceType,
  flow,
  buildingId,
  buildingName,
  roomId,
  roomName,
  floorId,
  unitId,
  parentName,
  parentType,
  canManageLifecycle = false,
  canManageOccupancyActions = false,
  onPress,
  lifecycleMenuProps,
}: BedInventoryListRowProps) {
  const { t } = useTranslation();
  const inactive = !isAccommodationEntityActive(bed);
  const occupantLabel = useBedOccupantLabel(spaceId, bed.bedId, bed.status);
  const displayLabel = formatBedDisplayLabel(bed.label, t);

  const occupancyContext = useMemo(
    () => ({
      target: buildBedOccupancyTarget({
        buildingId,
        buildingName: buildingName ?? '',
        floorId,
        floorName: parentType === 'floor' ? parentName : undefined,
        unitId,
        unitName: parentType === 'unit' ? parentName : undefined,
        roomId,
        roomName,
        bedId: bed.bedId,
        bedName: displayLabel,
      }),
      accommodationStatus: bed.status,
      occupancy: null,
    }),
    [
      bed.bedId,
      buildingId,
      buildingName,
      displayLabel,
      floorId,
      parentName,
      parentType,
      roomId,
      roomName,
      unitId,
    ],
  );

  const occupancyMenuOptions = useMemo(() => {
    if (!canManageOccupancyActions || inactive) {
      return [];
    }
    return buildBedOccupancyMenuOptions(
      bed,
      spaceType,
      occupancyContext,
      flow,
      t,
      onPress,
    );
  }, [
    bed,
    canManageOccupancyActions,
    inactive,
    flow,
    occupancyContext,
    onPress,
    spaceType,
    t,
  ]);

  const showMenu = canManageLifecycle || occupancyMenuOptions.length > 0;
  const occupantText =
    bed.status === 'RESERVED' && occupantLabel
      ? t('occupancy.quickActions.reservedFor', { name: occupantLabel })
      : bed.status === 'OCCUPIED' && occupantLabel
        ? t('occupancy.quickActions.occupiedBy', { name: occupantLabel })
        : null;

  return (
    <View style={styles.wrap}>
      <InventoryListingCard
        kind="bed"
        title={displayLabel}
        subtitle={occupantText}
        status={inactive ? null : bed.status}
        inactive={inactive}
        occupancyPercent={inactive ? 0 : occupancyPercentFromStatus(bed.status)}
        menu={
          showMenu ? (
            <BuilderRowLifecycleMenu
              {...lifecycleMenuProps}
              isInactive={inactive}
              prependOptions={occupancyMenuOptions}
              sheetTitle={t('occupancy.bedMenu.title', {
                bed: bed.label,
                defaultValue: `Bed ${bed.label}`,
              })}
              forceShowTrigger
            />
          ) : null
        }
        onPressDetails={onPress}
        onPressCard={onPress}
      />
      <View style={styles.pricing}>
        <BedPricingDisplay
          rent={bed.defaultRent}
          deposit={bed.defaultDeposit}
          layout="row"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  pricing: {
    paddingHorizontal: spacing.xs,
  },
});
