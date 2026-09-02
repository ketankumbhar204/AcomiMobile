import { accommodationApi } from '../api/accommodationApi';
import type {
  BedResponse,
  BuildingResponse,
  UUID,
} from '../api/types';
import { getAccommodationErrorMessage } from './accommodationErrors';

export type BuildingRenameSnapshot = Pick<BuildingResponse, 'code' | 'layoutMode'>;

export async function renameBuildingName(
  spaceId: UUID,
  buildingId: UUID,
  name: string,
  snapshot?: BuildingRenameSnapshot,
): Promise<BuildingResponse> {
  try {
    const meta =
      snapshot ?? (await accommodationApi.getBuilding(spaceId, buildingId));
    return await accommodationApi.updateBuilding(spaceId, buildingId, {
      name,
      code: meta.code ?? undefined,
      layoutMode: meta.layoutMode,
    });
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
): Promise<BedResponse> {
  try {
    const bed = await accommodationApi.getBed(spaceId, roomId, bedId);
    return await accommodationApi.updateBed(spaceId, roomId, bedId, {
      name,
      bedNumber: bed.bedNumber,
      status: bed.status,
      defaultRent: bed.defaultRent ?? null,
      defaultDeposit: bed.defaultDeposit ?? null,
    });
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
): Promise<BedResponse> {
  try {
    const bed = await accommodationApi.getBed(spaceId, roomId, bedId);
    return await accommodationApi.updateBed(spaceId, roomId, bedId, {
      name: bed.name,
      bedNumber,
      status: bed.status,
      defaultRent: bed.defaultRent ?? null,
      defaultDeposit: bed.defaultDeposit ?? null,
    });
  } catch (err) {
    throw new Error(getAccommodationErrorMessage(err, 'accommodation.errors.saveBed'));
  }
}

export async function updateBedPricingField(
  spaceId: UUID,
  roomId: UUID,
  bedId: UUID,
  field: 'defaultRent' | 'defaultDeposit',
  value: number | null,
): Promise<BedResponse> {
  try {
    const bed = await accommodationApi.getBed(spaceId, roomId, bedId);
    return await accommodationApi.updateBed(spaceId, roomId, bedId, {
      name: bed.name,
      bedNumber: bed.bedNumber,
      status: bed.status,
      defaultRent: field === 'defaultRent' ? value : (bed.defaultRent ?? null),
      defaultDeposit: field === 'defaultDeposit' ? value : (bed.defaultDeposit ?? null),
    });
  } catch (err) {
    throw new Error(getAccommodationErrorMessage(err, 'accommodation.errors.saveBed'));
  }
}
