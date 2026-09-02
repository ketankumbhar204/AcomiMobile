import type { UUID } from '../../../api/types';
import { accommodationApi } from '../../../api/accommodationApi';
import type { EditableSetupStructure } from './setupStructureTypes';

async function createBedsForRoom(
  spaceId: UUID,
  roomId: UUID,
  structure: EditableSetupStructure,
  room: EditableSetupStructure['floors'][number]['rooms'][number],
): Promise<number> {
  let count = 0;
  for (const bed of room.beds) {
    await accommodationApi.createBed(spaceId, roomId, {
      name: bed.label.trim(),
      bedNumber: bed.number.trim() || bed.label.trim(),
      status: 'AVAILABLE',
      defaultRent: bed.defaultRent ?? undefined,
      defaultDeposit: bed.defaultDeposit ?? undefined,
    });
    count += 1;
  }
  return count;
}

export async function executeSetupStructure(
  spaceId: UUID,
  structure: EditableSetupStructure,
): Promise<{ buildingId: UUID; totals: { floors: number; units: number; rooms: number; beds: number } }> {
  const building = await accommodationApi.createBuilding(spaceId, {
    name: structure.building.name.trim(),
    code: structure.building.code.trim() || undefined,
    layoutMode: structure.layoutMode,
  });

  let units = 0;
  let rooms = 0;
  let beds = 0;

  if (structure.kind === 'building_units') {
    for (const unit of structure.units) {
      const createdUnit = await accommodationApi.createUnit(spaceId, building.buildingId, {
        name: unit.name.trim(),
        unitNumber: unit.number.trim() || unit.name.trim(),
        status: 'AVAILABLE',
      });
      units += 1;

      for (const room of unit.rooms) {
        const createdRoom = await accommodationApi.createRoomUnderUnit(spaceId, createdUnit.unitId, {
          name: room.name.trim(),
          roomNumber: room.number.trim() || room.name.trim(),
          roomType: structure.roomType,
          capacity: room.capacity,
          status: 'AVAILABLE',
        });
        rooms += 1;
        beds += await createBedsForRoom(spaceId, createdRoom.roomId, structure, room);
      }
    }

    return {
      buildingId: building.buildingId,
      totals: { floors: 0, units, rooms, beds },
    };
  }

  for (const [floorIndex, floor] of structure.floors.entries()) {
    const createdFloor = await accommodationApi.createFloor(spaceId, building.buildingId, {
      name: floor.name.trim(),
      floorNumber: floor.number,
      sortOrder: floorIndex,
    });

    if (structure.kind === 'floors_with_units') {
      for (const unit of floor.units) {
        const createdUnit = await accommodationApi.createUnitOnFloor(
          spaceId,
          building.buildingId,
          createdFloor.floorId,
          {
            name: unit.name.trim(),
            unitNumber: unit.number.trim() || unit.name.trim(),
            status: 'AVAILABLE',
          },
        );
        units += 1;

        for (const room of unit.rooms) {
          const createdRoom = await accommodationApi.createRoomUnderUnit(spaceId, createdUnit.unitId, {
            name: room.name.trim(),
            roomNumber: room.number.trim() || room.name.trim(),
            roomType: structure.roomType,
            capacity: room.capacity,
            status: 'AVAILABLE',
          });
          rooms += 1;
          beds += await createBedsForRoom(spaceId, createdRoom.roomId, structure, room);
        }
      }
      continue;
    }

    for (const room of floor.rooms) {
      const createdRoom = await accommodationApi.createRoomUnderFloor(spaceId, createdFloor.floorId, {
        name: room.name.trim(),
        roomNumber: room.number.trim() || room.name.trim(),
        roomType: structure.roomType,
        capacity: room.capacity,
        status: 'AVAILABLE',
      });
      rooms += 1;
      beds += await createBedsForRoom(spaceId, createdRoom.roomId, structure, room);
    }
  }

  return {
    buildingId: building.buildingId,
    totals: {
      floors: structure.floors.length,
      units,
      rooms,
      beds,
    },
  };
}
