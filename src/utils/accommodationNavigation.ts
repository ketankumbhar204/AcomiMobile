import type { NavigationProp } from '@react-navigation/native';
import type { UUID } from '../api/types';
import type { MainStackParamList } from '../navigation/types';
import type { AccommodationTrailContext, AccommodationTrailLevel } from './accommodationContext';
/** Params passed together when opening a room or its beds — never mix stale IDs. */
export type AccommodationRoomBundle = {
  spaceId: UUID;
  buildingId: UUID;
  roomId: UUID;
  roomName: string;
  buildingName?: string;
  parentName?: string;
  parentType?: 'floor' | 'unit';
  floorId?: UUID;
  unitId?: UUID;
};

export function toAccommodationBedsParams(
  bundle: AccommodationRoomBundle,
): MainStackParamList['AccommodationBeds'] {
  return {
    spaceId: bundle.spaceId,
    buildingId: bundle.buildingId,
    roomId: bundle.roomId,
    roomName: bundle.roomName,
    buildingName: bundle.buildingName,
    parentName: bundle.parentName,
    parentType: bundle.parentType,
    floorId: bundle.floorId,
    unitId: bundle.unitId,
  };
}

export function toRoomDetailParams(
  bundle: AccommodationRoomBundle,
): MainStackParamList['RoomDetail'] {
  return {
    spaceId: bundle.spaceId,
    buildingId: bundle.buildingId,
    roomId: bundle.roomId,
    floorId: bundle.floorId,
    unitId: bundle.unitId,
  };
}

export function roomBundleFromRoom(
  spaceId: UUID,
  buildingId: UUID,
  room: {
    roomId: UUID;
    name: string;
    floorId?: UUID | null;
    unitId?: UUID | null;
    buildingId?: UUID | null;
  },
  parent?: { type: 'floor' | 'unit'; id: UUID },
  context?: {
    buildingName?: string;
    parentName?: string;
  },
): AccommodationRoomBundle {
  return {
    spaceId,
    buildingId: room.buildingId ?? buildingId,
    roomId: room.roomId,
    roomName: room.name,
    buildingName: context?.buildingName,
    parentName: context?.parentName,
    parentType: parent?.type,
    floorId: room.floorId ?? (parent?.type === 'floor' ? parent.id : undefined),
    unitId: room.unitId ?? (parent?.type === 'unit' ? parent.id : undefined),
  };
}

export function accommodationTrailContextFromParent(
  base: Pick<AccommodationTrailContext, 'spaceId' | 'buildingId' | 'buildingName'>,
  parentType: 'floor' | 'unit',
  parentId: UUID,
  parentName?: string,
  extra?: Pick<AccommodationTrailContext, 'roomId' | 'roomName' | 'bedLabel'>,
): AccommodationTrailContext {
  return {
    ...base,
    floorId: parentType === 'floor' ? parentId : undefined,
    floorName: parentType === 'floor' ? parentName : undefined,
    unitId: parentType === 'unit' ? parentId : undefined,
    unitName: parentType === 'unit' ? parentName : undefined,
    ...extra,
  };
}

export function navigateToAccommodationTrailSegment(
  navigation: NavigationProp<MainStackParamList>,
  context: AccommodationTrailContext,
  level: AccommodationTrailLevel,
): void {
  const { spaceId, buildingId, buildingName } = context;

  switch (level) {
    case 'building':
      navigation.navigate('AccommodationBuilder', { spaceId, buildingId });
      return;
    case 'floor':
      if (!context.floorId) {
        return;
      }
      if (context.layoutMode === 'APARTMENT_PG') {
        navigation.navigate('AccommodationFloorApartments', {
          spaceId,
          buildingId,
          buildingName,
          floorId: context.floorId,
          floorName: context.floorName,
        });
        return;
      }
      navigation.navigate('AccommodationRooms', {
        spaceId,
        buildingId,
        buildingName,
        parentType: 'floor',
        parentId: context.floorId,
        parentName: context.floorName,
      });
      return;
    case 'unit':
      if (!context.unitId) {
        return;
      }
      if (context.roomId) {
        navigation.navigate('AccommodationRooms', {
          spaceId,
          buildingId,
          buildingName,
          parentType: 'unit',
          parentId: context.unitId,
          parentName: context.unitName,
        });
        return;
      }
      navigation.navigate('UnitDetail', {
        spaceId,
        buildingId,
        buildingName,
        unitId: context.unitId,
      });
      return;
    case 'room':
      if (!context.roomId || !context.roomName) {
        return;
      }
      navigation.navigate('AccommodationBeds', {
        spaceId,
        buildingId,
        roomId: context.roomId,
        roomName: context.roomName,
        buildingName,
        parentName: context.floorName ?? context.unitName,
        parentType: context.floorId ? 'floor' : context.unitId ? 'unit' : undefined,
        floorId: context.floorId,
        unitId: context.unitId,
      });
      return;
    default:
      return;
  }
}
