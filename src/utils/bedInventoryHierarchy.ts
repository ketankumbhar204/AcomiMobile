import type { BuildingResponse, PropertyLayoutMode, SpaceType } from '../api/types';
import {
  getAccommodationUiProfile,
  type AccommodationUiProfile,
} from './accommodationProfile';
import {
  groupBedsByRoom,
  groupBedsByUnit,
  type BedRoomGroup,
  type BedUnitGroup,
} from './groupBedsByRoom';
import type { BedSpaceListItemResponse } from '../api/types';

export type BedInventoryFilterLevel = 'building' | 'floor' | 'unit';

const FILTER_LEVEL_ORDER: BedInventoryFilterLevel[] = ['building', 'floor', 'unit'];

export type BedInventoryListGroup =
  | { type: 'unit'; group: BedUnitGroup }
  | { type: 'room'; group: BedRoomGroup };

export function resolveBedInventoryProfile(
  spaceType: SpaceType,
  buildings: BuildingResponse[],
  selectedBuildingId?: string,
): AccommodationUiProfile | null {
  if (selectedBuildingId) {
    const building = buildings.find(item => item.buildingId === selectedBuildingId);
    return getAccommodationUiProfile(spaceType, building?.layoutMode);
  }
  return getAccommodationUiProfile(spaceType);
}

export function getBedInventoryFilterLevels(
  profile: AccommodationUiProfile | null,
): BedInventoryFilterLevel[] {
  if (!profile) {
    return ['building'];
  }

  const levels: BedInventoryFilterLevel[] = ['building'];

  if (profile.showFloors) {
    levels.push('floor');
  }

  if (profile.showUnitsOnFloor || profile.showUnits) {
    levels.push('unit');
  }

  return levels;
}

export function getBedInventoryFilterLevelsForContext(
  spaceType: SpaceType,
  buildings: BuildingResponse[],
  selectedBuildingId?: string,
): BedInventoryFilterLevel[] {
  return getBedInventoryFilterLevels(
    resolveBedInventoryProfile(spaceType, buildings, selectedBuildingId),
  );
}

export function bedInventoryUsesUnitGrouping(
  profile: AccommodationUiProfile | null,
): boolean {
  if (!profile) {
    return false;
  }
  return Boolean(
    (profile.showUnitsOnFloor || profile.showUnits) && profile.showRoomsUnderUnit,
  );
}

export function getBedInventoryUnitFilterParent(
  profile: AccommodationUiProfile | null,
): 'floor' | 'building' | null {
  if (!profile) {
    return null;
  }
  if (profile.showUnitsOnFloor) {
    return 'floor';
  }
  if (profile.showUnits) {
    return 'building';
  }
  return null;
}

export function sanitizeBedInventoryFilters(
  filters: { buildingId?: string; floorId?: string; unitId?: string },
  levels: BedInventoryFilterLevel[],
): { buildingId?: string; floorId?: string; unitId?: string } {
  const next = { ...filters };
  if (!levels.includes('floor')) {
    next.floorId = undefined;
  }
  if (!levels.includes('unit')) {
    next.unitId = undefined;
  }
  return next;
}

function groupBedsWithProfile(
  beds: BedSpaceListItemResponse[],
  profile: AccommodationUiProfile | null,
): BedInventoryListGroup[] {
  if (bedInventoryUsesUnitGrouping(profile)) {
    return groupBedsByUnit(beds).map(group => ({ type: 'unit', group }));
  }
  return groupBedsByRoom(beds).map(group => ({ type: 'room', group }));
}

function compareInventoryGroups(a: BedInventoryListGroup, b: BedInventoryListGroup): number {
  const label = (group: BedInventoryListGroup, pick: 'building' | 'floor' | 'unit' | 'room') => {
    if (group.type === 'unit') {
      const data = group.group;
      if (pick === 'building') return data.buildingName;
      if (pick === 'floor') return data.floorName;
      if (pick === 'unit') return data.unitName;
      return data.rooms[0]?.roomName;
    }
    const data = group.group;
    if (pick === 'building') return data.buildingName;
    if (pick === 'floor') return data.floorName;
    if (pick === 'unit') return data.unitName;
    return data.roomName;
  };

  return (
    (label(a, 'building') ?? '').localeCompare(label(b, 'building') ?? '', undefined, {
      sensitivity: 'base',
    }) ||
    (label(a, 'floor') ?? '').localeCompare(label(b, 'floor') ?? '', undefined, {
      sensitivity: 'base',
    }) ||
    (label(a, 'unit') ?? '').localeCompare(label(b, 'unit') ?? '', undefined, {
      sensitivity: 'base',
    }) ||
    (label(a, 'room') ?? '').localeCompare(label(b, 'room') ?? '', undefined, {
      sensitivity: 'base',
    })
  );
}

export function groupBedsForInventoryBrowse(
  beds: BedSpaceListItemResponse[],
  spaceType: SpaceType,
  buildings: BuildingResponse[],
  selectedBuildingId?: string,
): BedInventoryListGroup[] {
  if (selectedBuildingId) {
    const building = buildings.find(item => item.buildingId === selectedBuildingId);
    return groupBedsWithProfile(
      beds,
      getAccommodationUiProfile(spaceType, building?.layoutMode),
    );
  }

  const bedsByBuilding = new Map<string, BedSpaceListItemResponse[]>();
  for (const bed of beds) {
    const existing = bedsByBuilding.get(bed.buildingId);
    if (existing) {
      existing.push(bed);
    } else {
      bedsByBuilding.set(bed.buildingId, [bed]);
    }
  }

  const buildingLayoutById = new Map(
    buildings.map(building => [building.buildingId, building.layoutMode] as const),
  );

  const groups: BedInventoryListGroup[] = [];
  for (const [buildingId, buildingBeds] of bedsByBuilding) {
    const layoutMode: PropertyLayoutMode | undefined =
      buildingLayoutById.get(buildingId) ??
      resolveBedInventoryProfile(spaceType, buildings)?.layoutMode;
    groups.push(
      ...groupBedsWithProfile(buildingBeds, getAccommodationUiProfile(spaceType, layoutMode)),
    );
  }

  return groups.sort(compareInventoryGroups);
}

export function getOrderedBedInventoryFilterLevels(
  levels: BedInventoryFilterLevel[],
): BedInventoryFilterLevel[] {
  return FILTER_LEVEL_ORDER.filter(level => levels.includes(level));
}
