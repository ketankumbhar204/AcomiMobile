import type { AllocationTargetType, SpaceType } from '../api/types';
import {
  getAllowedTargetTypes,
  type OccupancyTargetSelection,
} from './occupancyRules';

export function buildBedOccupancyTarget(params: {
  buildingId: string;
  buildingName: string;
  floorId?: string;
  floorName?: string;
  unitId?: string;
  unitName?: string;
  roomId: string;
  roomName: string;
  bedId: string;
  bedName: string;
}): OccupancyTargetSelection {
  return {
    targetType: 'BED',
    buildingId: params.buildingId,
    buildingName: params.buildingName,
    floorId: params.floorId,
    floorName: params.floorName,
    unitId: params.unitId,
    unitName: params.unitName,
    roomId: params.roomId,
    roomName: params.roomName,
    bedId: params.bedId,
    bedName: params.bedName,
  };
}

export function buildRoomOccupancyTarget(params: {
  buildingId: string;
  buildingName: string;
  floorId?: string;
  floorName?: string;
  unitId?: string;
  unitName?: string;
  roomId: string;
  roomName: string;
}): OccupancyTargetSelection {
  return {
    targetType: 'ROOM',
    buildingId: params.buildingId,
    buildingName: params.buildingName,
    floorId: params.floorId,
    floorName: params.floorName,
    unitId: params.unitId,
    unitName: params.unitName,
    roomId: params.roomId,
    roomName: params.roomName,
  };
}

export function buildUnitOccupancyTarget(params: {
  buildingId: string;
  buildingName: string;
  unitId: string;
  unitName: string;
}): OccupancyTargetSelection {
  return {
    targetType: 'UNIT',
    buildingId: params.buildingId,
    buildingName: params.buildingName,
    unitId: params.unitId,
    unitName: params.unitName,
  };
}

export function isOccupancyTargetSupported(
  spaceType: SpaceType,
  targetType: AllocationTargetType,
): boolean {
  return getAllowedTargetTypes(spaceType).includes(targetType);
}
