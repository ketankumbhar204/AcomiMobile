import type { EditableBed, EditableFloor, EditableRoom, EditableSetupStructure, EditableUnit } from './setupStructureTypes';

export type FloorNamingPreset = 'numbered' | 'named';
export type UnitNamingPreset = 'hundreds' | 'alpha_numeric';
export type RoomNamingPreset = 'letters' | 'numbered';
export type BedNamingPreset = 'letters' | 'numbered' | 'positional';

function letterLabel(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}

function applyRoomPreset(rooms: EditableRoom[], preset: RoomNamingPreset): EditableRoom[] {
  return rooms.map((room, index) => {
    if (preset === 'letters') {
      const label = letterLabel(index);
      return { ...room, name: `Room ${label}`, number: label };
    }
    const number = String(index + 1);
    return { ...room, name: `Room ${number}`, number };
  });
}

function applyBedPreset(beds: EditableBed[], preset: BedNamingPreset): EditableBed[] {
  const positional = ['Lower', 'Middle', 'Upper'];
  return beds.map((bed, index) => {
    if (preset === 'positional' && index < positional.length) {
      const label = positional[index];
      return { ...bed, label, number: label };
    }
    if (preset === 'numbered') {
      const label = String(index + 1);
      return { ...bed, label, number: label };
    }
    const label = letterLabel(index);
    return { ...bed, label, number: label };
  });
}

export function applyFloorNamingPreset(
  structure: EditableSetupStructure,
  preset: FloorNamingPreset,
): EditableSetupStructure {
  const named = ['Ground', 'First', 'Second', 'Third', 'Fourth', 'Fifth'];
  return {
    ...structure,
    floors: structure.floors.map((floor, index) => ({
      ...floor,
      name: preset === 'named' ? `${named[index] ?? `Level ${index}`} Floor` : `Floor ${index + 1}`,
      number: index + 1,
    })),
  };
}

export function applyUnitNamingPreset(
  structure: EditableSetupStructure,
  preset: UnitNamingPreset,
): EditableSetupStructure {
  const patchUnits = (units: EditableUnit[], floorIndex: number) =>
    units.map((unit, index) => {
      if (preset === 'alpha_numeric') {
        const label = `A${index + 1}`;
        return { ...unit, name: `Unit ${label}`, number: label };
      }
      const number = String((floorIndex + 1) * 100 + (index + 1));
      return { ...unit, name: `Unit ${number}`, number };
    });

  if (structure.kind === 'building_units') {
    return {
      ...structure,
      units: patchUnits(structure.units, 0),
    };
  }

  return {
    ...structure,
    floors: structure.floors.map((floor, floorIndex) => ({
      ...floor,
      units: patchUnits(floor.units, floorIndex),
    })),
  };
}

export function applyRoomNamingPresetToAll(structure: EditableSetupStructure, preset: RoomNamingPreset) {
  if (structure.kind === 'building_units') {
    return {
      ...structure,
      units: structure.units.map(unit => ({
        ...unit,
        rooms: applyRoomPreset(unit.rooms, preset),
      })),
    };
  }

  return {
    ...structure,
    floors: structure.floors.map(floor => ({
      ...floor,
      units: floor.units.map(unit => ({
        ...unit,
        rooms: applyRoomPreset(unit.rooms, preset),
      })),
      rooms: applyRoomPreset(floor.rooms, preset),
    })),
  };
}

export function applyBedNamingPresetToAll(structure: EditableSetupStructure, preset: BedNamingPreset) {
  const patchRooms = (rooms: EditableRoom[]) =>
    rooms.map(room => ({
      ...room,
      beds: applyBedPreset(room.beds, preset),
    }));

  if (structure.kind === 'building_units') {
    return {
      ...structure,
      units: structure.units.map(unit => ({
        ...unit,
        rooms: patchRooms(unit.rooms),
      })),
    };
  }

  return {
    ...structure,
    floors: structure.floors.map(floor => ({
      ...floor,
      units: floor.units.map(unit => ({
        ...unit,
        rooms: patchRooms(unit.rooms),
      })),
      rooms: patchRooms(floor.rooms),
    })),
  };
}

export function getFloorCounts(floor: EditableFloor, kind: EditableSetupStructure['kind']) {
  if (kind === 'floors_with_units') {
    const rooms = floor.units.reduce((sum, unit) => sum + unit.rooms.length, 0);
    const beds = floor.units.reduce(
      (sum, unit) => sum + unit.rooms.reduce((roomSum, room) => roomSum + room.beds.length, 0),
      0,
    );
    return { units: floor.units.length, rooms, beds };
  }

  const beds = floor.rooms.reduce((sum, room) => sum + room.beds.length, 0);
  return { units: 0, rooms: floor.rooms.length, beds };
}

export function getUnitCounts(unit: EditableUnit) {
  const beds = unit.rooms.reduce((sum, room) => sum + room.beds.length, 0);
  return { rooms: unit.rooms.length, beds };
}

export function getRoomCounts(room: EditableRoom) {
  return { capacity: room.capacity, beds: room.beds.length };
}
