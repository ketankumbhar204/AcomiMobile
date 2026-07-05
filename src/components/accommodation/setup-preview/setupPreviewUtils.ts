import type {
  AccommodationSetupSampleNode,
  AccommodationSetupTotals,
} from '../../../api/types';

export type SetupPreviewChildItem = {
  label: string;
};

export type SetupPreviewFloor = {
  id: string;
  label: string;
  unitCount: number;
  roomCount: number;
  bedCount: number;
  childItems: SetupPreviewChildItem[];
  childType: 'unit' | 'room';
};

export type SetupStructurePreview = {
  buildingLabel: string;
  floors: SetupPreviewFloor[];
  /** Co-living / rental: units at building level (no floors). */
  buildingSection?: SetupPreviewFloor;
};

export const INITIAL_VISIBLE_FLOORS = 2;

function isType(node: AccommodationSetupSampleNode, type: string): boolean {
  return node.type.toLowerCase() === type.toLowerCase();
}

function childrenOfType(
  nodes: AccommodationSetupSampleNode[] | undefined,
  type: string,
): AccommodationSetupSampleNode[] {
  return nodes?.filter(node => isType(node, type)) ?? [];
}

function displayLabel(node: AccommodationSetupSampleNode): string {
  return node.number?.trim() || node.label?.trim() || '';
}

function floorLabel(node: AccommodationSetupSampleNode, index: number): string {
  const label = displayLabel(node);
  if (label) {
    return label;
  }
  return `Floor ${index + 1}`;
}

function distributeCount(total: number, index: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  const base = Math.floor(total / count);
  const remainder = total % count;
  return base + (index < remainder ? 1 : 0);
}

function parseFloorNode(
  floor: AccommodationSetupSampleNode,
  index: number,
): SetupPreviewFloor {
  const units = childrenOfType(floor.children, 'unit');
  const roomsDirect = childrenOfType(floor.children, 'room');

  if (units.length > 0) {
    const allRooms = units.flatMap(unit => childrenOfType(unit.children, 'room'));
    const allBeds = allRooms.flatMap(room => childrenOfType(room.children, 'bed'));

    return {
      id: `floor-${floor.number || index}`,
      label: floorLabel(floor, index),
      unitCount: units.length,
      roomCount: allRooms.length,
      bedCount: allBeds.length,
      childItems: units.map(unit => ({
        label: displayLabel(unit) || unit.label || 'Unit',
      })),
      childType: 'unit',
    };
  }

  const beds = roomsDirect.flatMap(room => childrenOfType(room.children, 'bed'));

  return {
    id: `floor-${floor.number || index}`,
    label: floorLabel(floor, index),
    unitCount: 0,
    roomCount: roomsDirect.length,
    bedCount: beds.length,
    childItems: roomsDirect.map(room => ({
      label: displayLabel(room) || room.label || 'Room',
    })),
    childType: 'room',
  };
}

function extractNumericSuffix(label: string): number | null {
  const match = label.match(/(\d+)\s*$/);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function inferChildLabels(
  templateItems: SetupPreviewChildItem[],
  floorIndex: number,
  count: number,
  childType: 'unit' | 'room',
): SetupPreviewChildItem[] {
  if (count <= 0) {
    return [];
  }

  if (templateItems.length === 0) {
    return Array.from({ length: count }, (_, itemIndex) => ({
      label:
        childType === 'unit'
          ? `Unit ${(floorIndex + 1) * 100 + itemIndex + 1}`
          : `Room ${itemIndex + 1}`,
    }));
  }

  const firstLabel = templateItems[0].label;
  const prefix = firstLabel.replace(/\d+\s*$/, '').trim();
  const firstNumber = extractNumericSuffix(firstLabel);

  if (firstNumber !== null) {
    const step =
      templateItems.length > 1
        ? (extractNumericSuffix(templateItems[1].label) ?? firstNumber + 1) - firstNumber
        : 1;
    const floorHundreds = Math.floor(firstNumber / 100) * 100;
    const floorOffset = floorHundreds > 0 ? floorIndex * 100 : floorIndex * step * count;

    return Array.from({ length: count }, (_, itemIndex) => {
      const value = firstNumber + floorOffset + itemIndex * step;
      const suffix = String(value);
      return { label: prefix ? `${prefix} ${suffix}`.trim() : suffix };
    });
  }

  return Array.from({ length: count }, (_, itemIndex) => ({
    label: `${firstLabel} ${itemIndex + 1}`,
  }));
}

function mergeFloorWithTotals(
  parsed: SetupPreviewFloor | undefined,
  floorIndex: number,
  totals: AccommodationSetupTotals,
  templateFloor?: SetupPreviewFloor,
): SetupPreviewFloor {
  const unitCount = distributeCount(totals.units, floorIndex, totals.floors);
  const roomCount = distributeCount(totals.rooms, floorIndex, totals.floors);
  const bedCount = distributeCount(totals.beds, floorIndex, totals.floors);
  const childType = parsed?.childType ?? templateFloor?.childType ?? 'unit';
  const childCount = childType === 'unit' ? unitCount : roomCount;
  const templateItems =
    parsed?.childItems.length
      ? parsed.childItems
      : templateFloor?.childItems ?? [];

  return {
    id: parsed?.id ?? `floor-${floorIndex}`,
    label: parsed?.label ?? `Floor ${floorIndex + 1}`,
    unitCount,
    roomCount,
    bedCount,
    childType,
    childItems:
      parsed?.childItems.length && parsed.childItems.length >= childCount
        ? parsed.childItems.slice(0, childCount)
        : inferChildLabels(templateItems, floorIndex, childCount, childType),
  };
}

function parseBuildingSection(
  root: AccommodationSetupSampleNode,
  totals: AccommodationSetupTotals,
): SetupPreviewFloor {
  const units = childrenOfType(root.children, 'unit');
  const allRooms = units.flatMap(unit => childrenOfType(unit.children, 'room'));
  const allBeds = allRooms.flatMap(room => childrenOfType(room.children, 'bed'));

  return {
    id: 'building-units',
    label: displayLabel(root) || root.label || 'Building',
    unitCount: totals.units || units.length,
    roomCount: totals.rooms || allRooms.length,
    bedCount: totals.beds || allBeds.length,
    childType: 'unit',
    childItems:
      units.length > 0
        ? units.map(unit => ({ label: displayLabel(unit) || unit.label || 'Unit' }))
        : inferChildLabels([], 0, totals.units, 'unit'),
  };
}

export function buildStructurePreview(
  nodes: AccommodationSetupSampleNode[],
  totals: AccommodationSetupTotals,
): SetupStructurePreview {
  const root = nodes[0];
  if (!root) {
    return { buildingLabel: 'Building', floors: [] };
  }

  const buildingLabel = displayLabel(root) || root.label || 'Building';
  const sampleFloors = childrenOfType(root.children, 'floor');
  const parsedFloors = sampleFloors.map((floor, index) => parseFloorNode(floor, index));
  const templateFloor = parsedFloors[0];

  if (totals.floors > 0) {
    const floors = Array.from({ length: totals.floors }, (_, floorIndex) =>
      mergeFloorWithTotals(parsedFloors[floorIndex], floorIndex, totals, templateFloor),
    );

    return { buildingLabel, floors };
  }

  if (totals.units > 0) {
    return {
      buildingLabel,
      floors: [],
      buildingSection: parseBuildingSection(root, totals),
    };
  }

  return { buildingLabel, floors: parsedFloors };
}
