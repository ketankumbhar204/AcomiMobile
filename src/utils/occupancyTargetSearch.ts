import { accommodationApi } from '../api/accommodationApi';
import type {
  AllocationTargetType,
  BuildingResponse,
  SpaceType,
} from '../api/types';
import { getAllowedTargetTypes } from './occupancyRules';

export type OccupancySearchResult = {
  key: string;
  targetType: AllocationTargetType;
  buildingId: string;
  buildingName: string;
  floorId?: string;
  floorName?: string;
  unitId?: string;
  unitName?: string;
  roomId?: string;
  roomName?: string;
  bedId?: string;
  bedName?: string;
};

const MAX_ROOM_CANDIDATES = 20;
const MAX_RESULTS = 30;

function stripSearchPrefix(query: string): string {
  return query.replace(/^(room|flat|unit)-/i, '').trim();
}

function parseBedAwareQuery(query: string): { entityQuery: string; bedLabel?: string } {
  const trimmed = stripSearchPrefix(query);
  const hyphenIdx = trimmed.lastIndexOf('-');
  if (hyphenIdx > 0) {
    const suffix = trimmed.slice(hyphenIdx + 1).trim();
    if (suffix.length > 0 && suffix.length <= 4) {
      return {
        entityQuery: stripSearchPrefix(trimmed.slice(0, hyphenIdx)),
        bedLabel: suffix,
      };
    }
  }
  return { entityQuery: trimmed };
}

function bedLabelMatches(label: string, bedLabel?: string): boolean {
  if (!bedLabel) {
    return true;
  }
  return label.toLowerCase() === bedLabel.toLowerCase();
}

async function resolveRoomHierarchy(
  spaceId: string,
  buildingId: string | null | undefined,
  floorId: string | null | undefined,
  unitId: string | null | undefined,
  buildingsById: Map<string, BuildingResponse>,
): Promise<{
  buildingId: string;
  buildingName: string;
  floorId?: string;
  floorName?: string;
  unitId?: string;
  unitName?: string;
}> {
  const resolvedBuildingId = buildingId ?? '';
  const buildingName = buildingsById.get(resolvedBuildingId)?.name ?? '—';
  let floorName: string | undefined;
  let unitName: string | undefined;

  if (floorId) {
    try {
      const floor = await accommodationApi.getFloorById(spaceId, floorId);
      floorName = floor.name;
    } catch {
      floorName = undefined;
    }
  }

  if (unitId) {
    try {
      const unit = await accommodationApi.getUnitById(spaceId, unitId);
      unitName = unit.name;
    } catch {
      unitName = undefined;
    }
  }

  return {
    buildingId: resolvedBuildingId,
    buildingName,
    floorId: floorId ?? undefined,
    floorName,
    unitId: unitId ?? undefined,
    unitName,
  };
}

async function searchBedTargets(
  spaceId: string,
  query: string,
  buildingsById: Map<string, BuildingResponse>,
): Promise<OccupancySearchResult[]> {
  const { entityQuery, bedLabel } = parseBedAwareQuery(query);
  if (!entityQuery) {
    return [];
  }

  const page = await accommodationApi.searchRooms(spaceId, entityQuery, { size: MAX_ROOM_CANDIDATES });
  const candidates = page.content.filter(room => room.availableBeds > 0).slice(0, MAX_ROOM_CANDIDATES);
  const results: OccupancySearchResult[] = [];

  for (const roomItem of candidates) {
    if (results.length >= MAX_RESULTS) {
      break;
    }

    let roomDetail;
    try {
      roomDetail = await accommodationApi.getRoom(spaceId, roomItem.roomId);
    } catch {
      continue;
    }

    if (!roomDetail.buildingId) {
      continue;
    }

    const hierarchy = await resolveRoomHierarchy(
      spaceId,
      roomDetail.buildingId,
      roomDetail.floorId,
      roomDetail.unitId,
      buildingsById,
    );

    let bedsPage;
    try {
      bedsPage = await accommodationApi.listBeds(spaceId, roomItem.roomId, {
        view: 'summary',
        size: 50,
      });
    } catch {
      continue;
    }

    const availableBeds = bedsPage.content.filter(
      bed => bed.status === 'AVAILABLE' && bedLabelMatches(bed.label, bedLabel),
    );

    for (const bed of availableBeds) {
      if (results.length >= MAX_RESULTS) {
        break;
      }
      results.push({
        key: `bed:${roomItem.roomId}:${bed.bedId}`,
        targetType: 'BED',
        buildingId: hierarchy.buildingId,
        buildingName: hierarchy.buildingName,
        floorId: hierarchy.floorId,
        floorName: hierarchy.floorName,
        unitId: hierarchy.unitId,
        unitName: hierarchy.unitName,
        roomId: roomItem.roomId,
        roomName: roomItem.name,
        bedId: bed.bedId,
        bedName: bed.label,
      });
    }
  }

  return results;
}

async function searchRoomTargets(
  spaceId: string,
  query: string,
  buildingsById: Map<string, BuildingResponse>,
): Promise<OccupancySearchResult[]> {
  const entityQuery = stripSearchPrefix(query);
  if (!entityQuery) {
    return [];
  }

  const page = await accommodationApi.searchRooms(spaceId, entityQuery, { size: MAX_ROOM_CANDIDATES });
  const candidates = page.content.filter(
    room => room.bedCount > 0 && room.availableBeds >= room.bedCount,
  );
  const results: OccupancySearchResult[] = [];

  for (const roomItem of candidates) {
    if (results.length >= MAX_RESULTS) {
      break;
    }

    let roomDetail;
    try {
      roomDetail = await accommodationApi.getRoom(spaceId, roomItem.roomId);
    } catch {
      continue;
    }

    if (!roomDetail.buildingId) {
      continue;
    }

    const hierarchy = await resolveRoomHierarchy(
      spaceId,
      roomDetail.buildingId,
      roomDetail.floorId,
      roomDetail.unitId,
      buildingsById,
    );

    results.push({
      key: `room:${roomItem.roomId}`,
      targetType: 'ROOM',
      buildingId: hierarchy.buildingId,
      buildingName: hierarchy.buildingName,
      floorId: hierarchy.floorId,
      floorName: hierarchy.floorName,
      unitId: hierarchy.unitId,
      unitName: hierarchy.unitName,
      roomId: roomItem.roomId,
      roomName: roomItem.name,
    });
  }

  return results;
}

async function searchUnitTargets(
  spaceId: string,
  query: string,
  buildingsById: Map<string, BuildingResponse>,
): Promise<OccupancySearchResult[]> {
  const entityQuery = stripSearchPrefix(query);
  if (!entityQuery) {
    return [];
  }

  const page = await accommodationApi.searchUnits(spaceId, entityQuery, { size: MAX_ROOM_CANDIDATES });
  const candidates = page.content.filter(unit => !unit.synthetic && unit.status === 'AVAILABLE');
  const results: OccupancySearchResult[] = [];

  for (const unitItem of candidates) {
    if (results.length >= MAX_RESULTS) {
      break;
    }

    let unitDetail;
    try {
      unitDetail = await accommodationApi.getUnitById(spaceId, unitItem.unitId);
    } catch {
      continue;
    }

    results.push({
      key: `unit:${unitItem.unitId}`,
      targetType: 'UNIT',
      buildingId: unitDetail.buildingId,
      buildingName: buildingsById.get(unitDetail.buildingId)?.name ?? '—',
      unitId: unitItem.unitId,
      unitName: unitItem.name,
    });
  }

  return results;
}

export async function searchOccupancyTargets(
  spaceId: string,
  spaceType: SpaceType,
  query: string,
): Promise<OccupancySearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) {
    return [];
  }

  const allowed = getAllowedTargetTypes(spaceType);
  const buildings = await accommodationApi.getBuildings(spaceId);
  const buildingsById = new Map(buildings.map(b => [b.buildingId, b]));

  const resultGroups = await Promise.all([
    allowed.includes('BED') ? searchBedTargets(spaceId, trimmed, buildingsById) : Promise.resolve([]),
    allowed.includes('ROOM') ? searchRoomTargets(spaceId, trimmed, buildingsById) : Promise.resolve([]),
    allowed.includes('UNIT') ? searchUnitTargets(spaceId, trimmed, buildingsById) : Promise.resolve([]),
  ]);

  const merged = [...resultGroups[0], ...resultGroups[1], ...resultGroups[2]];
  const seen = new Set<string>();
  const unique: OccupancySearchResult[] = [];

  for (const item of merged) {
    if (seen.has(item.key)) {
      continue;
    }
    seen.add(item.key);
    unique.push(item);
    if (unique.length >= MAX_RESULTS) {
      break;
    }
  }

  return unique;
}
