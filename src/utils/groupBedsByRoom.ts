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
      beds: [bed],
    });
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
