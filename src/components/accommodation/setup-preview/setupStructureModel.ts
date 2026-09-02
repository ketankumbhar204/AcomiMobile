import type { AccommodationSetupSampleNode, AccommodationSetupTotals } from '../../../api/types';
import { generateIdempotencyKey } from '../../../utils/accommodationSetup';
import { buildStructurePreview } from './setupPreviewUtils';
import type {
  EditableBed,
  EditableFloor,
  EditableRoom,
  EditableSetupStructure,
  EditableUnit,
  ExpandStructureConfig,
  SetupStructureTotals,
  StructureKind,
} from './setupStructureTypes';

export function createStructureId(): string {
  return generateIdempotencyKey();
}

function distributeCount(total: number, index: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  const base = Math.floor(total / count);
  const remainder = total % count;
  return base + (index < remainder ? 1 : 0);
}

function extractNumericSuffix(label: string): number | null {
  const match = label.match(/(\d+)\s*$/);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function inferLabels(
  templateItems: string[],
  index: number,
  count: number,
  fallbackPrefix: string,
): string[] {
  if (count <= 0) {
    return [];
  }

  if (templateItems.length === 0) {
    return Array.from({ length: count }, (_, itemIndex) => `${fallbackPrefix} ${itemIndex + 1}`);
  }

  const firstLabel = templateItems[0];
  const prefix = firstLabel.replace(/\d+\s*$/, '').trim();
  const firstNumber = extractNumericSuffix(firstLabel);
  const step =
    templateItems.length > 1
      ? (extractNumericSuffix(templateItems[1]) ?? (firstNumber ?? 0) + 1) - (firstNumber ?? 0)
      : 1;

  if (firstNumber !== null) {
    const floorHundreds = Math.floor(firstNumber / 100) * 100;
    const offset = floorHundreds > 0 ? index * 100 : index * step * count;
    return Array.from({ length: count }, (_, itemIndex) => {
      const value = firstNumber + offset + itemIndex * step;
      const suffix = String(value);
      return prefix ? `${prefix} ${suffix}`.trim() : suffix;
    });
  }

  return Array.from({ length: count }, (_, itemIndex) => `${firstLabel} ${itemIndex + 1}`);
}

function createBeds(count: number, bedLabels?: string[]): EditableBed[] {
  return Array.from({ length: count }, (_, index) => {
    const label = bedLabels?.[index] ?? String.fromCharCode(65 + index);
    return {
      id: createStructureId(),
      label,
      number: label,
    };
  });
}

function createRooms(
  count: number,
  bedsPerRoom: number,
  capacity: number,
  roomLabels?: string[],
): EditableRoom[] {
  return Array.from({ length: count }, (_, index) => {
    const letter = String.fromCharCode(65 + (index % 26));
    const label = roomLabels?.[index] ?? letter;
    return {
      id: createStructureId(),
      name: label.startsWith('Room') ? label : `Room ${label}`,
      number: label,
      capacity,
      beds: createBeds(bedsPerRoom),
    };
  });
}

function createUnits(
  count: number,
  roomsPerUnit: number,
  bedsPerRoom: number,
  capacity: number,
  unitLabels: string[],
  floorIndex: number,
): EditableUnit[] {
  const labels = inferLabels(unitLabels, floorIndex, count, 'Unit');

  return labels.map(label => {
    const number = extractNumericSuffix(label)?.toString() ?? label;
    return {
      id: createStructureId(),
      name: label,
      number,
      rooms: createRooms(roomsPerUnit, bedsPerRoom, capacity),
    };
  });
}

function detectStructureKind(
  layoutMode: ExpandStructureConfig['layoutMode'],
  spaceType: ExpandStructureConfig['spaceType'],
): StructureKind {
  if (layoutMode === 'APARTMENT_PG') {
    return 'floors_with_units';
  }
  if (layoutMode === 'CORRIDOR_PG' || spaceType === 'PG' || spaceType === 'HOSTEL') {
    return 'floors_with_rooms';
  }
  return 'building_units';
}

function floorName(index: number, includeGroundFloor: boolean): string {
  if (includeGroundFloor && index === 0) {
    return 'Ground Floor';
  }
  return `Floor ${includeGroundFloor ? index : index + 1}`;
}

export function expandToEditableStructure(
  nodes: AccommodationSetupSampleNode[],
  totals: AccommodationSetupTotals,
  config: ExpandStructureConfig,
): EditableSetupStructure {
  const preview = buildStructurePreview(nodes, totals);
  const kind = detectStructureKind(config.layoutMode, config.spaceType);
  const templateUnitLabels =
    preview.floors[0]?.childItems.map(item => item.label) ??
    preview.buildingSection?.childItems.map(item => item.label) ??
    [];

  if (kind === 'building_units') {
    const unitCount = totals.units || templateUnitLabels.length || 1;
    return {
      building: {
        name: config.buildingName || preview.buildingLabel,
        code: config.buildingCode,
      },
      kind,
      layoutMode: config.layoutMode,
      spaceType: config.spaceType,
      roomType: config.roomType,
      floors: [],
      units: createUnits(
        unitCount,
        config.roomsPerParent,
        config.bedsPerRoom,
        config.capacityPerRoom,
        templateUnitLabels,
        0,
      ),
    };
  }

  const floors: EditableFloor[] = Array.from({ length: Math.max(totals.floors, 1) }, (_, index) => {
    const parsedFloor = preview.floors[index];
    const unitCount = distributeCount(totals.units, index, totals.floors);
    const roomCount = distributeCount(totals.rooms, index, totals.floors);

    if (kind === 'floors_with_units') {
      const roomsPerUnit =
        unitCount > 0 ? Math.max(1, Math.round(roomCount / unitCount)) : config.roomsPerParent;

      return {
        id: parsedFloor?.id ?? createStructureId(),
        name: parsedFloor?.label ?? floorName(index, config.includeGroundFloor),
        number: config.includeGroundFloor ? index : index + 1,
        units: createUnits(
          unitCount || 1,
          roomsPerUnit || config.roomsPerParent,
          config.bedsPerRoom,
          config.capacityPerRoom,
          parsedFloor?.childItems.map(item => item.label) ?? templateUnitLabels,
          index,
        ),
        rooms: [],
      };
    }

    const roomsPerFloor = roomCount || config.roomsPerParent;
    const bedsPerRoom =
      roomsPerFloor > 0
        ? Math.max(1, Math.round(distributeCount(totals.beds, index, totals.floors) / roomsPerFloor))
        : config.bedsPerRoom;

    return {
      id: parsedFloor?.id ?? createStructureId(),
        name: parsedFloor?.label ?? floorName(index, config.includeGroundFloor),
        number: config.includeGroundFloor ? index : index + 1,
        units: [],
      rooms: createRooms(
        roomsPerFloor,
        bedsPerRoom || config.bedsPerRoom,
        config.capacityPerRoom,
        parsedFloor?.childItems.map(item => item.label),
      ),
    };
  });

  return {
    building: {
      name: config.buildingName || preview.buildingLabel,
      code: config.buildingCode,
    },
    kind,
    layoutMode: config.layoutMode,
    spaceType: config.spaceType,
    roomType: config.roomType,
    floors,
    units: [],
  };
}

export function computeStructureTotals(structure: EditableSetupStructure): SetupStructureTotals {
  if (structure.kind === 'building_units') {
    const rooms = structure.units.reduce((sum, unit) => sum + unit.rooms.length, 0);
    const beds = structure.units.reduce(
      (sum, unit) => sum + unit.rooms.reduce((roomSum, room) => roomSum + room.beds.length, 0),
      0,
    );
    return {
      floors: 0,
      units: structure.units.length,
      rooms,
      beds,
    };
  }

  let units = 0;
  let rooms = 0;
  let beds = 0;

  for (const floor of structure.floors) {
    if (structure.kind === 'floors_with_units') {
      units += floor.units.length;
      for (const unit of floor.units) {
        rooms += unit.rooms.length;
        beds += unit.rooms.reduce((sum, room) => sum + room.beds.length, 0);
      }
    } else {
      rooms += floor.rooms.length;
      beds += floor.rooms.reduce((sum, room) => sum + room.beds.length, 0);
    }
  }

  return {
    floors: structure.floors.length,
    units,
    rooms,
    beds,
  };
}
