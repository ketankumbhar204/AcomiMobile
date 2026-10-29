import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SpaceType } from '../../api/types';
import type { usePersistedUnitInteraction } from '../../hooks/usePersistedUnitInteraction';
import type { MainStackParamList } from '../../navigation/types';
import { BedInteractionSheet } from './BedInteractionSheet';

type Host = ReturnType<typeof usePersistedUnitInteraction>;

export function PersistedUnitInteractionHost({
  interaction,
  spaceId,
  spaceType,
  buildingId,
  buildingName,
}: {
  interaction: Host;
  spaceId: string;
  spaceType?: SpaceType | null;
  buildingId: string;
  buildingName?: string;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const {
    target,
    detailsLoading,
    close,
    save,
    saving,
    canEditStructure,
    canManageOccupancy,
    onOccupancySuccess,
  } = interaction;

  return (
    <BedInteractionSheet
      visible={target != null}
      mode="persisted"
      entity="unit"
      fieldsLoading={detailsLoading}
      label={target?.label ?? ''}
      spaceId={spaceId}
      bedNumber={target?.unitNumber ?? ''}
      status={target?.status}
      locationLine={target?.locationLine}
      rent={target?.rent}
      deposit={target?.deposit}
      canEditStructure={canEditStructure}
      canManageOccupancy={canManageOccupancy}
      inactive={target?.inactive}
      saving={saving}
      occupancy={
        target?.occupancyTarget && spaceType
          ? {
              spaceId,
              spaceType,
              target: target.occupancyTarget,
              occupancy: target.occupancy,
              onSuccess: onOccupancySuccess,
            }
          : undefined
      }
      onClose={close}
      onOpenDetails={
        target
          ? () => {
              close();
              navigation.navigate('UnitDetail', {
                spaceId,
                buildingId,
                buildingName,
                unitId: target.unitId,
              });
            }
          : undefined
      }
      onSave={draft => {
        void save(draft);
      }}
    />
  );
}
