import { accommodationApi } from '../api/accommodationApi';
import type {
  AllocationTargetSearchResponse,
  UUID,
} from '../api/types';
import { allocationTargetToSelection } from './allocationTargetSearch';
import type { OccupancyTargetSelection } from './occupancyRules';

export type PrefilledTargetResult = {
  row: AllocationTargetSearchResponse;
  selection: OccupancyTargetSelection;
};

export async function fetchPrefilledAllocationTarget(
  spaceId: UUID,
  ids: {
    bedId?: UUID;
    roomId?: UUID;
    unitId?: UUID;
    buildingId?: UUID;
  },
): Promise<PrefilledTargetResult | null> {
  if (ids.bedId && ids.roomId) {
    const [bed, room] = await Promise.all([
      accommodationApi.getBed(spaceId, ids.roomId, ids.bedId),
      accommodationApi.getRoom(spaceId, ids.roomId),
    ]);

    const buildingId = ids.buildingId ?? room.buildingId ?? undefined;
    let buildingName = '';
    let floorName = '';

    if (buildingId && room.floorId) {
      const [building, floor] = await Promise.all([
        accommodationApi.getBuilding(spaceId, buildingId),
        accommodationApi.getFloor(spaceId, buildingId, room.floorId),
      ]);
      buildingName = building.name;
      floorName = floor.name;
    } else if (buildingId) {
      const building = await accommodationApi.getBuilding(spaceId, buildingId);
      buildingName = building.name;
    }

    const displayPath = [buildingName, floorName, room.name, bed.name]
      .filter(Boolean)
      .join(' · ');

    const row: AllocationTargetSearchResponse = {
      targetType: 'BED',
      targetId: ids.bedId,
      buildingId: buildingId ?? '',
      buildingName,
      floorId: room.floorId,
      floorName: floorName || null,
      roomId: ids.roomId,
      roomName: room.name,
      roomNumber: room.roomNumber,
      bedId: ids.bedId,
      bedName: bed.name,
      bedNumber: bed.bedNumber,
      displayPath,
      displayPathShort: bed.name,
      status: bed.status,
      defaultRent: bed.defaultRent,
      defaultDeposit: bed.defaultDeposit,
      selectable: bed.status === 'AVAILABLE',
      notSelectableReason: bed.status === 'AVAILABLE' ? null : bed.status,
    };

    return { row, selection: allocationTargetToSelection(row) };
  }

  if (ids.unitId) {
    const unit = await accommodationApi.getUnitById(spaceId, ids.unitId);
    const buildingId = ids.buildingId ?? unit.buildingId;
    const building = await accommodationApi.getBuilding(spaceId, buildingId);
    const displayPath = [building.name, unit.name].filter(Boolean).join(' · ');

    const row: AllocationTargetSearchResponse = {
      targetType: 'UNIT',
      targetId: ids.unitId,
      buildingId,
      buildingName: building.name,
      unitId: ids.unitId,
      unitName: unit.name,
      displayPath,
      displayPathShort: unit.name,
      status: unit.status,
      defaultRent: unit.defaultRent,
      defaultDeposit: unit.defaultDeposit,
      selectable: unit.status === 'AVAILABLE',
      notSelectableReason: unit.status === 'AVAILABLE' ? null : unit.status,
    };

    return { row, selection: allocationTargetToSelection(row) };
  }

  return null;
}
