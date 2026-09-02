import type { EditableBed, EditableSetupStructure } from './setupStructureTypes';

export type PricingField = 'defaultRent' | 'defaultDeposit';

export function parseOptionalMoney(value: string | number | null | undefined): number | null {
  if (value == null) {
    return null;
  }
  const raw = typeof value === 'number' ? String(value) : value.trim();
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function isEmptyMoney(value: number | null | undefined): boolean {
  return value == null || Number.isNaN(value);
}

type BedRef = {
  bed: EditableBed;
  roomIndex: number;
  bedIndex: number;
  unitIndex: number | null;
  floorIndex: number | null;
};

function collectBeds(structure: EditableSetupStructure): BedRef[] {
  const refs: BedRef[] = [];
  if (structure.kind === 'building_units') {
    structure.units.forEach((unit, unitIndex) => {
      unit.rooms.forEach((room, roomIndex) => {
        room.beds.forEach((bed, bedIndex) => {
          refs.push({ bed, roomIndex, bedIndex, unitIndex, floorIndex: null });
        });
      });
    });
    return refs;
  }

  structure.floors.forEach((floor, floorIndex) => {
    if (structure.kind === 'floors_with_units') {
      floor.units.forEach((unit, unitIndex) => {
        unit.rooms.forEach((room, roomIndex) => {
          room.beds.forEach((bed, bedIndex) => {
            refs.push({ bed, roomIndex, bedIndex, unitIndex, floorIndex });
          });
        });
      });
      return;
    }
    floor.rooms.forEach((room, roomIndex) => {
      room.beds.forEach((bed, bedIndex) => {
        refs.push({ bed, roomIndex, bedIndex, unitIndex: null, floorIndex });
      });
    });
  });
  return refs;
}

function isEquivalent(
  structure: EditableSetupStructure,
  source: BedRef,
  candidate: BedRef,
): boolean {
  if (source.bed.id === candidate.bed.id) {
    return false;
  }
  if (structure.kind === 'floors_with_units' || structure.kind === 'building_units') {
    return source.roomIndex === candidate.roomIndex && source.bedIndex === candidate.bedIndex;
  }
  return source.bedIndex === candidate.bedIndex;
}

export function setBedPricingField(
  structure: EditableSetupStructure,
  bedId: string,
  field: PricingField,
  value: number | null | undefined,
): EditableSetupStructure {
  return mapBeds(structure, bed =>
    bed.id === bedId ? { ...bed, [field]: value ?? null } : bed,
  );
}

function mapBeds(
  structure: EditableSetupStructure,
  mapper: (bed: EditableBed) => EditableBed,
): EditableSetupStructure {
  const mapRoomBeds = (beds: EditableBed[]) => beds.map(mapper);
  const mapRooms = (rooms: EditableSetupStructure['floors'][number]['rooms']) =>
    rooms.map(room => ({ ...room, beds: mapRoomBeds(room.beds) }));
  const mapUnits = (units: EditableSetupStructure['units']) =>
    units.map(unit => ({ ...unit, rooms: mapRooms(unit.rooms) }));

  if (structure.kind === 'building_units') {
    return { ...structure, units: mapUnits(structure.units) };
  }
  return {
    ...structure,
    floors: structure.floors.map(floor =>
      structure.kind === 'floors_with_units'
        ? { ...floor, units: mapUnits(floor.units) }
        : { ...floor, rooms: mapRooms(floor.rooms) },
    ),
  };
}

/** One-shot copy of a valid rent/deposit into equivalent empty beds. Does not overwrite. */
export function propagateBedPricing(
  structure: EditableSetupStructure,
  sourceBedId: string,
  field: PricingField,
): EditableSetupStructure {
  const refs = collectBeds(structure);
  const source = refs.find(ref => ref.bed.id === sourceBedId);
  if (!source) {
    return structure;
  }
  const sourceValue = source.bed[field];
  if (isEmptyMoney(sourceValue)) {
    return structure;
  }
  const equivalentIds = new Set(
    refs.filter(ref => isEquivalent(structure, source, ref)).map(ref => ref.bed.id),
  );
  if (equivalentIds.size === 0) {
    return structure;
  }
  return mapBeds(structure, bed => {
    if (!equivalentIds.has(bed.id) || !isEmptyMoney(bed[field])) {
      return bed;
    }
    return { ...bed, [field]: sourceValue };
  });
}
