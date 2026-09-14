import type { BedSpaceListItemResponse } from '../api/types';

export type BedRoomGroup = {
  key: string;
  buildingId: string;
  buildingName: string;
  floorId?: string | null;
  floorName?: string | null;
  unitId?: string | null;
  unitName?: string | null;
  roomId: string;
  roomName: string;
  roomType?: string | null;
  beds: BedSpaceListItemResponse[];
};

function roomGroupKey(bed: BedSpaceListItemResponse): string {
  return [
    bed.buildingId,
    bed.floorId ?? 'no-floor',
    bed.unitId ?? 'no-unit',
    bed.roomId,
  ].join(':');
}

function compareLabels(a: string | undefined | null, b: string | undefined | null): number {
  return (a ?? '').localeCompare(b ?? '', undefined, { sensitivity: 'base' });
}

export function dedupeBedsById(beds: BedSpaceListItemResponse[]): BedSpaceListItemResponse[] {
  const seen = new Map<string, BedSpaceListItemResponse>();
  for (const bed of beds) {
    seen.set(bed.bedId, bed);
  }
  return Array.from(seen.values());
}

export function groupBedsByRoom(beds: BedSpaceListItemResponse[]): BedRoomGroup[] {
  const deduped = dedupeBedsById(beds);
  const groups = new Map<string, BedRoomGroup>();

  for (const bed of deduped) {
    const key = roomGroupKey(bed);
    const existing = groups.get(key);
    if (existing) {
      existing.beds.push(bed);
      continue;
    }
    groups.set(key, {
      key,
      buildingId: bed.buildingId,
      buildingName: bed.buildingName,
      floorId: bed.floorId,
      floorName: bed.floorName,
      unitId: bed.unitId,
      unitName: bed.unitName,
      roomId: bed.roomId,
      roomName: bed.roomName,
      roomType: bed.roomType,
      beds: [bed],
    });
  }

  for (const group of groups.values()) {
    if (!group.roomType) {
      group.roomType = group.beds.find(b => b.roomType)?.roomType ?? null;
    }
  }

  const result = Array.from(groups.values());

  for (const group of result) {
    group.beds.sort((a, b) => compareLabels(a.label, b.label));
  }

  result.sort((a, b) => {
    return (
      compareLabels(a.buildingName, b.buildingName) ||
      compareLabels(a.floorName, b.floorName) ||
      compareLabels(a.unitName, b.unitName) ||
      compareLabels(a.roomName, b.roomName)
    );
  });

  return result;
}

export function formatRoomGroupPath(group: BedRoomGroup): string {
  return roomGroupPathSegments(group).join(' > ');
}

/** Path segments for arrow-icon separators in inventory headers. */
export function roomGroupPathSegments(
  group: BedRoomGroup,
  options?: { includeBuilding?: boolean; includeUnit?: boolean },
): string[] {
  const includeBuilding = options?.includeBuilding ?? false;
  const includeUnit = options?.includeUnit ?? Boolean(group.unitId);
  return [
    includeBuilding ? group.buildingName : null,
    group.floorName,
    includeUnit ? group.unitName : null,
    group.roomName,
  ]
    .map(part => part?.trim())
    .filter((part): part is string => Boolean(part));
}

/** Corridor-style path without unit (Floor > Room). */
export function formatRoomGroupPathCompact(
  group: BedRoomGroup,
  options?: { includeUnit?: boolean },
): string {
  return roomGroupPathSegments(group, options).join(' > ');
}

/** Full path including building (dashboard / multi-building views). */
export function formatRoomGroupPathWithBuilding(group: BedRoomGroup): string {
  return [group.buildingName, group.floorName, group.unitName, group.roomName]
    .filter(Boolean)
    .join(' > ');
}

export function formatRoomGroupLocation(group: BedRoomGroup): string {
  return [group.unitName, group.floorName].filter(Boolean).join(' · ');
}

export type BedUnitGroup = {
  key: string;
  buildingId: string;
  buildingName: string;
  floorId?: string | null;
  floorName?: string | null;
  unitId?: string | null;
  unitName?: string | null;
  rooms: BedRoomGroup[];
};

function unitGroupKey(group: BedRoomGroup): string {
  return [
    group.buildingId,
    group.floorId ?? 'no-floor',
    group.unitId ?? 'no-unit',
  ].join(':');
}

export function formatUnitGroupLocation(group: BedUnitGroup): string {
  return [group.floorName, group.buildingName].filter(Boolean).join(' · ');
}

export function groupBedsByUnit(beds: BedSpaceListItemResponse[]): BedUnitGroup[] {
  const roomGroups = groupBedsByRoom(beds);
  const units = new Map<string, BedUnitGroup>();

  for (const room of roomGroups) {
    const key = unitGroupKey(room);
    const existing = units.get(key);
    if (existing) {
      existing.rooms.push(room);
      continue;
    }
    units.set(key, {
      key,
      buildingId: room.buildingId,
      buildingName: room.buildingName,
      floorId: room.floorId,
      floorName: room.floorName,
      unitId: room.unitId,
      unitName: room.unitName,
      rooms: [room],
    });
  }

  const result = Array.from(units.values());

  for (const unit of result) {
    unit.rooms.sort((a, b) => compareLabels(a.roomName, b.roomName));
  }

  result.sort((a, b) => {
    return (
      compareLabels(a.buildingName, b.buildingName) ||
      compareLabels(a.floorName, b.floorName) ||
      compareLabels(a.unitName, b.unitName)
    );
  });

  return result;
}

export type BedFloorGroup = {
  key: string;
  buildingId: string;
  buildingName: string;
  floorId?: string | null;
  floorName?: string | null;
  rooms: BedRoomGroup[];
};

function floorGroupKey(group: BedRoomGroup): string {
  return [group.buildingId, group.floorId ?? 'no-floor'].join(':');
}

export function groupBedsByFloor(beds: BedSpaceListItemResponse[]): BedFloorGroup[] {
  const roomGroups = groupBedsByRoom(beds);
  const floors = new Map<string, BedFloorGroup>();

  for (const room of roomGroups) {
    const key = floorGroupKey(room);
    const existing = floors.get(key);
    if (existing) {
      existing.rooms.push(room);
      continue;
    }
    floors.set(key, {
      key,
      buildingId: room.buildingId,
      buildingName: room.buildingName,
      floorId: room.floorId,
      floorName: room.floorName,
      rooms: [room],
    });
  }

  const result = Array.from(floors.values());
  result.sort((a, b) => compareLabels(a.floorName, b.floorName));
  return result;
}

export function floorGroupBedCount(group: BedFloorGroup): number {
  return group.rooms.reduce((sum, room) => sum + room.beds.length, 0);
}

export function roomGroupAvailableCount(group: BedRoomGroup): number {
  return group.beds.filter(bed => bed.status === 'AVAILABLE').length;
}
