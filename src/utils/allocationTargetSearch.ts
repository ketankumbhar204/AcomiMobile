import type {
  AllocationTargetSearchResponse,
  AllocationTargetType,
} from '../api/types';
import type { OccupancyTargetSelection } from './occupancyRules';

export function allocationTargetToSelection(
  row: AllocationTargetSearchResponse,
): OccupancyTargetSelection {
  const targetType = row.targetType as AllocationTargetType;
  return {
    targetType,
    buildingId: row.buildingId,
    buildingName: row.buildingName,
    floorId: row.floorId ?? undefined,
    floorName: row.floorName ?? undefined,
    unitId: row.unitId ?? undefined,
    unitName: row.unitName ?? undefined,
    roomId: row.roomId ?? undefined,
    roomName: row.roomName ?? row.roomNumber ?? undefined,
    bedId: row.bedId ?? undefined,
    bedName: row.bedName ?? row.bedNumber ?? undefined,
  };
}

export function allocationTargetIds(row: AllocationTargetSearchResponse): {
  bedId?: string;
  roomId?: string;
  unitId?: string;
} {
  if (row.targetType === 'UNIT') {
    return { unitId: row.unitId ?? row.targetId };
  }
  return {
    bedId: row.bedId ?? row.targetId,
    roomId: row.roomId ?? undefined,
    unitId: row.unitId ?? undefined,
  };
}
