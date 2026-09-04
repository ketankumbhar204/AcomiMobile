import type {
  EditableFloor,
  EditableRoom,
  EditableSetupStructure,
  EditableUnit,
  ExpandStructureConfig,
} from './setupStructureTypes';
import { createStructureId } from './setupStructureModel';

function cloneWithNewIds<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function reassignIdsFloor(floor: EditableFloor): EditableFloor {
  const next = cloneWithNewIds(floor);
  next.id = createStructureId();
  next.units = next.units.map(unit => {
    unit.id = createStructureId();
    unit.rooms = unit.rooms.map(room => {
      room.id = createStructureId();
      room.beds = room.beds.map(bed => ({ ...bed, id: createStructureId() }));
      return room;
    });
    return unit;
  });
  next.rooms = next.rooms.map(room => {
    room.id = createStructureId();
    room.beds = room.beds.map(bed => ({ ...bed, id: createStructureId() }));
    return room;
  });
  return next;
}

function createRooms(count: number, bedsPerRoom: number, capacity: number): EditableRoom[] {
  return Array.from({ length: count }, (_, index) => {
    const letter = String.fromCharCode(65 + (index % 26));
    return {
      id: createStructureId(),
      name: `Room ${letter}`,
      number: letter,
      capacity,
      beds: Array.from({ length: bedsPerRoom }, (_, bedIndex) => ({
        id: createStructureId(),
        label: String.fromCharCode(65 + bedIndex),
        number: String.fromCharCode(65 + bedIndex),
      })),
    };
  });
}

function createUnits(
  count: number,
  roomsPerUnit: number,
  bedsPerRoom: number,
  capacity: number,
): EditableUnit[] {
  return Array.from({ length: count }, (_, index) => ({
    id: createStructureId(),
    name: `Unit ${101 + index}`,
    number: String(101 + index),
    rooms: createRooms(roomsPerUnit, bedsPerRoom, capacity),
  }));
}

function floorName(
  index: number,
  includeGroundFloor: boolean,
  groundFloorName = 'Ground Floor',
  floorNameTemplate = 'Floor {{number}}',
): string {
  if (includeGroundFloor && index === 0) {
    return groundFloorName;
  }
  const number = includeGroundFloor ? index : index + 1;
  return floorNameTemplate.replace('{{number}}', String(number));
}

export function duplicateFloor(structure: EditableSetupStructure, floorId: string): EditableSetupStructure {
  const index = structure.floors.findIndex(floor => floor.id === floorId);
  if (index < 0) {
    return structure;
  }
  const copy = reassignIdsFloor(structure.floors[index]);
  copy.name = `${copy.name} Copy`;
  copy.number = structure.floors.length + 1;
  const floors = [...structure.floors];
  floors.splice(index + 1, 0, copy);
  return { ...structure, floors };
}

export function deleteFloor(structure: EditableSetupStructure, floorId: string): EditableSetupStructure {
  if (structure.floors.length <= 1) {
    return structure;
  }
  return {
    ...structure,
    floors: structure.floors.filter(floor => floor.id !== floorId),
  };
}

export function setFloorCount(
  structure: EditableSetupStructure,
  count: number,
  config: Pick<
    ExpandStructureConfig,
    | 'roomsPerParent'
    | 'bedsPerRoom'
    | 'capacityPerRoom'
    | 'includeGroundFloor'
    | 'groundFloorName'
    | 'floorNameTemplate'
  >,
): EditableSetupStructure {
  const safeCount = Math.max(1, Math.min(count, 20));
  const floors = [...structure.floors];

  while (floors.length < safeCount) {
    const index = floors.length;
    const template = floors[floors.length - 1];
    const next = template
      ? reassignIdsFloor(template)
      : {
          id: createStructureId(),
          name: floorName(
            index,
            config.includeGroundFloor,
            config.groundFloorName,
            config.floorNameTemplate,
          ),
          number: index + 1,
          units: [],
          rooms: [],
        };
    next.name = floorName(
      index,
      config.includeGroundFloor,
      config.groundFloorName,
      config.floorNameTemplate,
    );
    next.number = index + 1;
    if (structure.kind === 'floors_with_units' && next.units.length === 0) {
      next.units = createUnits(1, config.roomsPerParent, config.bedsPerRoom, config.capacityPerRoom);
    }
    if (structure.kind === 'floors_with_rooms' && next.rooms.length === 0) {
      next.rooms = createRooms(config.roomsPerParent, config.bedsPerRoom, config.capacityPerRoom);
    }
    floors.push(next);
  }

  while (floors.length > safeCount) {
    floors.pop();
  }

  return { ...structure, floors };
}

export function duplicateUnit(
  structure: EditableSetupStructure,
  floorId: string | null,
  unitId: string,
): EditableSetupStructure {
  if (structure.kind === 'building_units') {
    const index = structure.units.findIndex(unit => unit.id === unitId);
    if (index < 0) {
      return structure;
    }
    const copy = cloneWithNewIds(structure.units[index]);
    copy.id = createStructureId();
    copy.name = `${copy.name} Copy`;
    const units = [...structure.units];
    units.splice(index + 1, 0, copy);
    return { ...structure, units };
  }

  return {
    ...structure,
    floors: structure.floors.map(floor => {
      if (floor.id !== floorId) {
        return floor;
      }
      const index = floor.units.findIndex(unit => unit.id === unitId);
      if (index < 0) {
        return floor;
      }
      const copy = cloneWithNewIds(floor.units[index]);
      copy.id = createStructureId();
      copy.name = `${copy.name} Copy`;
      const units = [...floor.units];
      units.splice(index + 1, 0, copy);
      return { ...floor, units };
    }),
  };
}

export function deleteUnit(
  structure: EditableSetupStructure,
  floorId: string | null,
  unitId: string,
): EditableSetupStructure {
  if (structure.kind === 'building_units') {
    if (structure.units.length <= 1) {
      return structure;
    }
    return {
      ...structure,
      units: structure.units.filter(unit => unit.id !== unitId),
    };
  }

  return {
    ...structure,
    floors: structure.floors.map(floor => {
      if (floor.id !== floorId || floor.units.length <= 1) {
        return floor;
      }
      return {
        ...floor,
        units: floor.units.filter(unit => unit.id !== unitId),
      };
    }),
  };
}

export function addUnit(
  structure: EditableSetupStructure,
  floorId: string | null,
  config: Pick<ExpandStructureConfig, 'roomsPerParent' | 'bedsPerRoom' | 'capacityPerRoom'>,
): EditableSetupStructure {
  const newUnit: EditableUnit = {
    id: createStructureId(),
    name: 'Unit',
    number: '101',
    rooms: createRooms(config.roomsPerParent, config.bedsPerRoom, config.capacityPerRoom),
  };

  if (structure.kind === 'building_units') {
    return { ...structure, units: [...structure.units, newUnit] };
  }

  return {
    ...structure,
    floors: structure.floors.map(floor => {
      if (floor.id !== floorId) {
        return floor;
      }
      return { ...floor, units: [...floor.units, newUnit] };
    }),
  };
}

export function duplicateRoom(
  structure: EditableSetupStructure,
  floorId: string | null,
  unitId: string | null,
  roomId: string,
): EditableSetupStructure {
  const patchRooms = (rooms: EditableRoom[]) => {
    const index = rooms.findIndex(room => room.id === roomId);
    if (index < 0) {
      return rooms;
    }
    const copy = cloneWithNewIds(rooms[index]);
    copy.id = createStructureId();
    copy.name = `${copy.name} Copy`;
    const next = [...rooms];
    next.splice(index + 1, 0, copy);
    return next;
  };

  if (structure.kind === 'building_units' && unitId) {
    return {
      ...structure,
      units: structure.units.map(unit =>
        unit.id === unitId ? { ...unit, rooms: patchRooms(unit.rooms) } : unit,
      ),
    };
  }

  if (structure.kind === 'floors_with_units' && floorId && unitId) {
    return {
      ...structure,
      floors: structure.floors.map(floor =>
        floor.id === floorId
          ? {
              ...floor,
              units: floor.units.map(unit =>
                unit.id === unitId ? { ...unit, rooms: patchRooms(unit.rooms) } : unit,
              ),
            }
          : floor,
      ),
    };
  }

  if (floorId) {
    return {
      ...structure,
      floors: structure.floors.map(floor =>
        floor.id === floorId ? { ...floor, rooms: patchRooms(floor.rooms) } : floor,
      ),
    };
  }

  return structure;
}

export function deleteRoom(
  structure: EditableSetupStructure,
  floorId: string | null,
  unitId: string | null,
  roomId: string,
): EditableSetupStructure {
  const removeFromRooms = (rooms: EditableRoom[]) => {
    if (rooms.length <= 1) {
      return rooms;
    }
    return rooms.filter(room => room.id !== roomId);
  };

  if (structure.kind === 'building_units' && unitId) {
    return {
      ...structure,
      units: structure.units.map(unit =>
        unit.id === unitId ? { ...unit, rooms: removeFromRooms(unit.rooms) } : unit,
      ),
    };
  }

  if (structure.kind === 'floors_with_units' && floorId && unitId) {
    return {
      ...structure,
      floors: structure.floors.map(floor =>
        floor.id === floorId
          ? {
              ...floor,
              units: floor.units.map(unit =>
                unit.id === unitId ? { ...unit, rooms: removeFromRooms(unit.rooms) } : unit,
              ),
            }
          : floor,
      ),
    };
  }

  if (floorId) {
    return {
      ...structure,
      floors: structure.floors.map(floor =>
        floor.id === floorId ? { ...floor, rooms: removeFromRooms(floor.rooms) } : floor,
      ),
    };
  }

  return structure;
}

export function addRoom(
  structure: EditableSetupStructure,
  floorId: string | null,
  unitId: string | null,
  config: Pick<ExpandStructureConfig, 'bedsPerRoom' | 'capacityPerRoom'>,
): EditableSetupStructure {
  const newRoom = createRooms(1, config.bedsPerRoom, config.capacityPerRoom)[0];

  if (structure.kind === 'building_units' && unitId) {
    return {
      ...structure,
      units: structure.units.map(unit =>
        unit.id === unitId ? { ...unit, rooms: [...unit.rooms, newRoom] } : unit,
      ),
    };
  }

  if (structure.kind === 'floors_with_units' && floorId && unitId) {
    return {
      ...structure,
      floors: structure.floors.map(floor =>
        floor.id === floorId
          ? {
              ...floor,
              units: floor.units.map(unit =>
                unit.id === unitId ? { ...unit, rooms: [...unit.rooms, newRoom] } : unit,
              ),
            }
          : floor,
      ),
    };
  }

  if (floorId) {
    return {
      ...structure,
      floors: structure.floors.map(floor =>
        floor.id === floorId ? { ...floor, rooms: [...floor.rooms, newRoom] } : floor,
      ),
    };
  }

  return structure;
}

export function addBed(
  structure: EditableSetupStructure,
  floorId: string | null,
  unitId: string | null,
  roomId: string,
): EditableSetupStructure {
  const patchRoom = (room: EditableRoom): EditableRoom => {
    if (room.id !== roomId) {
      return room;
    }
    const label = String.fromCharCode(65 + room.beds.length);
    return {
      ...room,
      beds: [...room.beds, { id: createStructureId(), label, number: label }],
    };
  };

  const mapRooms = (rooms: EditableRoom[]) => rooms.map(patchRoom);

  if (structure.kind === 'building_units' && unitId) {
    return {
      ...structure,
      units: structure.units.map(unit =>
        unit.id === unitId ? { ...unit, rooms: mapRooms(unit.rooms) } : unit,
      ),
    };
  }

  if (structure.kind === 'floors_with_units' && floorId && unitId) {
    return {
      ...structure,
      floors: structure.floors.map(floor =>
        floor.id === floorId
          ? {
              ...floor,
              units: floor.units.map(unit =>
                unit.id === unitId ? { ...unit, rooms: mapRooms(unit.rooms) } : unit,
              ),
            }
          : floor,
      ),
    };
  }

  if (floorId) {
    return {
      ...structure,
      floors: structure.floors.map(floor =>
        floor.id === floorId ? { ...floor, rooms: mapRooms(floor.rooms) } : floor,
      ),
    };
  }

  return structure;
}

export function deleteBed(
  structure: EditableSetupStructure,
  floorId: string | null,
  unitId: string | null,
  roomId: string,
  bedId: string,
): EditableSetupStructure {
  const patchRoom = (room: EditableRoom): EditableRoom => {
    if (room.id !== roomId || room.beds.length <= 1) {
      return room;
    }
    return {
      ...room,
      beds: room.beds.filter(bed => bed.id !== bedId),
    };
  };

  const mapRooms = (rooms: EditableRoom[]) => rooms.map(patchRoom);

  if (structure.kind === 'building_units' && unitId) {
    return {
      ...structure,
      units: structure.units.map(unit =>
        unit.id === unitId ? { ...unit, rooms: mapRooms(unit.rooms) } : unit,
      ),
    };
  }

  if (structure.kind === 'floors_with_units' && floorId && unitId) {
    return {
      ...structure,
      floors: structure.floors.map(floor =>
        floor.id === floorId
          ? {
              ...floor,
              units: floor.units.map(unit =>
                unit.id === unitId ? { ...unit, rooms: mapRooms(unit.rooms) } : unit,
              ),
            }
          : floor,
      ),
    };
  }

  if (floorId) {
    return {
      ...structure,
      floors: structure.floors.map(floor =>
        floor.id === floorId ? { ...floor, rooms: mapRooms(floor.rooms) } : floor,
      ),
    };
  }

  return structure;
}

export function moveItem<T extends { id: string }>(items: T[], id: string, direction: -1 | 1): T[] {
  const index = items.findIndex(item => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}
