import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BedListItemResponse, SpaceType } from '../../api/types';
import { AccommodationEntityRow } from '../accommodation/AccommodationEntityRow';
import { AccommodationStatusBadge } from '../accommodation/AccommodationStatusBadge';
import { BuilderRowLifecycleMenu } from '../accommodation/BuilderRowLifecycleMenu';
import type { BuilderRowLifecycleMenuProps } from '../accommodation/BuilderRowLifecycleMenu';
import { useBedOccupantLabel } from '../../hooks/useBedOccupantLabel';
import type { useAccommodationOccupancyFlow } from '../../hooks/useAccommodationOccupancyFlow';
import { colors, spacing, typography } from '../../theme';
import { buildBedOccupancyMenuOptions } from '../../utils/bedOccupancyMenuOptions';
import { buildBedOccupancyTarget } from '../../utils/buildOccupancyTarget';

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
  editableName?: boolean;
  onSaveName?: (name: string) => Promise<void>;
  onPress: () => void;
  lifecycleMenuProps: Omit<
    BuilderRowLifecycleMenuProps,
    'prependOptions' | 'sheetTitle' | 'forceShowTrigger'
  >;
};

function BedOccupantMeta({
  status,
  occupantLabel,
}: {
  status: BedListItemResponse['status'];
  occupantLabel: string | null;
}) {
  const { t } = useTranslation();

  const text =
    status === 'RESERVED' && occupantLabel
      ? t('occupancy.quickActions.reservedFor', { name: occupantLabel })
      : status === 'OCCUPIED' && occupantLabel
        ? t('occupancy.quickActions.occupiedBy', { name: occupantLabel })
        : status === 'RESERVED' || status === 'OCCUPIED'
          ? t('occupancy.quickActions.loadingOccupant')
          : '\u00A0';

  return (
    <Text style={styles.meta} numberOfLines={1}>
      {text}
    </Text>
  );
}

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
  editableName,
  onSaveName,
  onPress,
  lifecycleMenuProps,
}: BedInventoryListRowProps) {
  const { t } = useTranslation();
  const occupantLabel = useBedOccupantLabel(spaceId, bed.bedId, bed.status);

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
        bedName: bed.label,
      }),
      accommodationStatus: bed.status,
      occupancy: null,
    }),
    [
      bed.bedId,
      bed.label,
      buildingId,
      buildingName,
      floorId,
      parentName,
      parentType,
      roomId,
      roomName,
      unitId,
    ],
  );

  const occupancyMenuOptions = useMemo(() => {
    if (!canManageOccupancyActions) {
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
    flow,
    occupancyContext,
    onPress,
    spaceType,
    t,
  ]);

  const showMenu = canManageLifecycle || occupancyMenuOptions.length > 0;

  return (
    <AccommodationEntityRow
      title={bed.label}
      meta={
        canManageOccupancyActions ? (
          <BedOccupantMeta status={bed.status} occupantLabel={occupantLabel} />
        ) : undefined
      }
      badge={<AccommodationStatusBadge status={bed.status} />}
      iconLabel={bed.label.charAt(0).toUpperCase()}
      editableName={editableName}
      onSaveName={onSaveName}
      onPress={onPress}
      showChevron={!showMenu}
      menu={
        showMenu ? (
          <BuilderRowLifecycleMenu
            {...lifecycleMenuProps}
            prependOptions={occupancyMenuOptions}
            sheetTitle={t('occupancy.bedMenu.title', {
              bed: bed.label,
              defaultValue: `Bed ${bed.label}`,
            })}
            forceShowTrigger
          />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    minHeight: 18,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
});
