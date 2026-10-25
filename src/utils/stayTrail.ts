function prefixed(value: string | null | undefined, prefix: string): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  return trimmed.toLowerCase().startsWith(prefix.toLowerCase()) ? trimmed : `${prefix}${trimmed}`;
}

export type StayLayoutMode = 'CORRIDOR_PG' | 'APARTMENT_PG' | 'CO_LIVING' | 'RENTAL' | string;

function addStayPart(parts: string[], value?: string | null) {
  const trimmed = value?.trim() ?? '';
  if (trimmed) {
    parts.push(trimmed);
  }
}

function floorLabel(value?: string | null): string | null {
  return prefixed(value, 'Floor ');
}

/**
 * Building → Floor → Unit → Room → Bed.
 * Corridor stays omit the unit. Rental stays stop at the unit. Missing levels are omitted.
 */
export function formatPaymentStayLabel(input: {
  multipleBuildings?: boolean;
  layoutMode?: StayLayoutMode | null;
  buildingName?: string | null;
  floorName?: string | null;
  unitName?: string | null;
  roomName?: string | null;
  bedName?: string | null;
}): string | null {
  const mode = input.layoutMode || 'APARTMENT_PG';
  const parts: string[] = [];
  addStayPart(parts, input.buildingName);
  addStayPart(parts, floorLabel(input.floorName));
  const addUnit = () => addStayPart(parts, prefixed(input.unitName, 'Unit '));
  const addSleeping = () => {
    addStayPart(parts, prefixed(input.roomName, 'Room '));
    addStayPart(parts, prefixed(input.bedName, 'Bed '));
  };
  switch (mode) {
    case 'CORRIDOR_PG':
      addSleeping();
      break;
    case 'RENTAL':
      addUnit();
      break;
    case 'CO_LIVING':
    case 'APARTMENT_PG':
      addUnit();
      addSleeping();
      break;
    default:
      addUnit();
      addSleeping();
  }
  return parts.length > 0 ? parts.join(' • ') : null;
}

/** Unit → Room → Bed, omitting any level that is not set. */
export function formatHierarchyTrail(parts: {
  unit?: string | null;
  room?: string | null;
  bed?: string | null;
}): string | null {
  const segments = [
    prefixed(parts.unit, 'Unit '),
    prefixed(parts.room, 'Room '),
    prefixed(parts.bed, 'Bed '),
  ].filter((part): part is string => Boolean(part));
  return segments.length > 0 ? segments.join(' → ') : null;
}

/** Turns "Unit 101 • Room C • Bed 2" into "Unit 101 → Room C → Bed 2". */
export function formatStayTrail(label: string | null | undefined): string | null {
  const raw = label?.trim() ?? '';
  if (!raw) {
    return null;
  }
  const parts = raw
    .split(/\s*[•·|]\s*/)
    .map(part => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' → ') : null;
}
