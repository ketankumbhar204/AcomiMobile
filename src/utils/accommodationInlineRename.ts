import { accommodationApi } from '../api/accommodationApi';
import type { UUID } from '../api/types';
import { getAccommodationErrorMessage } from './accommodationErrors';
import { invalidateAccommodationQueries } from './accommodationQueryCache';

async function afterRename() {
  invalidateAccommodationQueries();
}

export async function renameBuildingName(
  spaceId: UUID,
  buildingId: UUID,
  name: string,
): Promise<void> {
  try {
    const building = await accommodationApi.getBuilding(spaceId, buildingId);
    await accommodationApi.updateBuilding(spaceId, buildingId, {
      name,
      code: building.code ?? undefined,
      layoutMode: building.layoutMode,
    });
    await afterRename();
  } catch (err) {
    throw new Error(getAccommodationErrorMessage(err, 'accommodation.errors.saveBuilding'));
  }
}

export async function renameFloorName(
  spaceId: UUID,
  buildingId: UUID,
  floorId: UUID,
  name: string,
): Promise<void> {
  try {
    const floor = await accommodationApi.getFloor(spaceId, buildingId, floorId);
    await accommodationApi.updateFloor(spaceId, buildingId, floorId, {
      name,
      floorNumber: floor.floorNumber,
      sortOrder: floor.sortOrder,
    });
    await afterRename();
  } catch (err) {
    throw new Error(getAccommodationErrorMessage(err, 'accommodation.errors.saveFloor'));
  }
}

export async function renameUnitName(
  spaceId: UUID,
  buildingId: UUID,
  unitId: UUID,
  name: string,
): Promise<void> {
  try {
    const unit = await accommodationApi.getUnitById(spaceId, unitId);
    await accommodationApi.updateUnitById(spaceId, unitId, {
      name,
      unitNumber: unit.unitNumber,
      status: unit.status,
      unitKind: unit.unitKind ?? undefined,
    });
    await afterRename();
  } catch (err) {
    throw new Error(getAccommodationErrorMessage(err, 'accommodation.errors.saveUnit'));
  }
}

export async function renameRoomName(
  spaceId: UUID,
  roomId: UUID,
  name: string,
): Promise<void> {
  try {
    const room = await accommodationApi.getRoom(spaceId, roomId);
    await accommodationApi.updateRoom(spaceId, roomId, {
      name,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      capacity: room.capacity,
      status: room.status,
    });
    await afterRename();
  } catch (err) {
    throw new Error(getAccommodationErrorMessage(err, 'accommodation.errors.saveRoom'));
  }
}

export async function renameBedName(
  spaceId: UUID,
  _buildingId: UUID,
  roomId: UUID,
  bedId: UUID,
  name: string,
): Promise<void> {
  try {
    const bed = await accommodationApi.getBed(spaceId, roomId, bedId);
    await accommodationApi.updateBed(spaceId, roomId, bedId, {
      name,
      bedNumber: bed.bedNumber,
      status: bed.status,
    });
    await afterRename();
  } catch (err) {
    throw new Error(getAccommodationErrorMessage(err, 'accommodation.errors.saveBed'));
  }
}

/** Updates the bed number shown in list rows (label). */
export async function renameBedNumber(
  spaceId: UUID,
  _buildingId: UUID,
  roomId: UUID,
  bedId: UUID,
  bedNumber: string,
): Promise<void> {
  try {
    const bed = await accommodationApi.getBed(spaceId, roomId, bedId);
    await accommodationApi.updateBed(spaceId, roomId, bedId, {
      name: bed.name,
      bedNumber,
      status: bed.status,
    });
    await afterRename();
  } catch (err) {
    throw new Error(getAccommodationErrorMessage(err, 'accommodation.errors.saveBed'));
  }
}
