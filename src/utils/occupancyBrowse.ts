import { accommodationApi } from '../api/accommodationApi';
import type {
  AccommodationStatus,
  AllocationTargetType,
  BuildingResponse,
  FloorListItemResponse,
  SpaceType,
  UnitListItemResponse,
} from '../api/types';
import { getAccommodationUiProfile } from './accommodationProfile';
import type { OccupancyTargetSelection } from './occupancyRules';
import { getAllowedTargetTypes } from './occupancyRules';
import type { OccupancySearchResult } from './occupancyTargetSearch';

export type OccupancyBrowseBedItem = {
  bedId: string;
  label: string;
  selection: OccupancyTargetSelection;
};

export type OccupancyBrowseRoomGroup = {
  key: string;
  roomId: string;
  roomName: string;
  floorName?: string;
  unitName?: string;
  roomType: string;
  bedCount: number;
  availableCount: number;
  beds: OccupancyBrowseBedItem[];
};

export type OccupancyBrowseUnitItem = {
  unitId: string;
  unitName: string;
  status: AccommodationStatus;
  selection: OccupancyTargetSelection;
};

function buildBedSelection(
  building: BuildingResponse,
  targetType: AllocationTargetType,
  context: {
    floorId?: string;
    floorName?: string;
    unitId?: string;
    unitName?: string;
    roomId: string;
    roomName: string;
    bedId: string;
    bedName: string;
  },
): OccupancyTargetSelection {
  return {
    targetType,
    buildingId: building.buildingId,
    buildingName: building.name,
    floorId: context.floorId,
    floorName: context.floorName,
    unitId: context.unitId,
    unitName: context.unitName,
    roomId: context.roomId,
    roomName: context.roomName,
    bedId: context.bedId,
    bedName: context.bedName,
  };
}

async function loadBedsForRoom(
  spaceId: string,
  building: BuildingResponse,
  room: {
    roomId: string;
    name: string;
    roomType: string;
    bedCount: number;
    availableBeds: number;
    floorName?: string;
    unitName?: string;
    floorId?: string;
    unitId?: string;
  },
): Promise<OccupancyBrowseRoomGroup | null> {
  const bedsPage = await accommodationApi.listBeds(spaceId, room.roomId, {
    view: 'summary',
    size: 50,
  });
  const availableBeds = bedsPage.content.filter(bed => bed.status === 'AVAILABLE');
  if (availableBeds.length === 0) {
    return null;
  }

  return {
    key: room.roomId,
    roomId: room.roomId,
    roomName: room.name,
    floorName: room.floorName,
    unitName: room.unitName,
    roomType: room.roomType,
    bedCount: room.bedCount,
    availableCount: availableBeds.length,
    beds: availableBeds.map(bed => ({
      bedId: bed.bedId,
      label: bed.label,
      selection: buildBedSelection(building, 'BED', {
        floorId: room.floorId,
        floorName: room.floorName,
        unitId: room.unitId,
        unitName: room.unitName,
        roomId: room.roomId,
        roomName: room.name,
        bedId: bed.bedId,
        bedName: bed.label,
      }),
    })),
  };
}

export async function loadFloorsForBrowse(
  spaceId: string,
  buildingId: string,
): Promise<FloorListItemResponse[]> {
  const page = await accommodationApi.listFloors(spaceId, buildingId, {
    view: 'summary',
    size: 50,
  });
  return page.content;
}

export function browseUsesFloorTabs(spaceType: SpaceType, building: BuildingResponse): boolean {
  const profile = getAccommodationUiProfile(spaceType, building.layoutMode);
  return Boolean(profile?.showFloors && profile.showBeds);
}

/** Load available room/bed groups for a single floor (avoids whole-building API storms). */
export async function loadRoomBedGroupsForFloor(
  spaceId: string,
  spaceType: SpaceType,
  building: BuildingResponse,
  floor: FloorListItemResponse,
): Promise<OccupancyBrowseRoomGroup[]> {
  const profile = getAccommodationUiProfile(spaceType, building.layoutMode);
  if (!profile?.showBeds) {
    return [];
  }

  if (profile.showRoomsUnderFloor) {
    const roomsPage = await accommodationApi.listRoomsByFloor(spaceId, floor.floorId, {
      view: 'summary',
      size: 100,
    });
    const rooms = roomsPage.content.filter(item => item.availableBeds > 0);
    const roomGroups = await Promise.all(
      rooms.map(room =>
        loadBedsForRoom(spaceId, building, {
          roomId: room.roomId,
          name: room.name,
          roomType: room.roomType,
          bedCount: room.bedCount,
          availableBeds: room.availableBeds,
          floorId: floor.floorId,
          floorName: floor.name,
        }),
      ),
    );
    return roomGroups.filter((group): group is OccupancyBrowseRoomGroup => group !== null);
  }

  if (profile.showUnitsOnFloor && profile.showRoomsUnderUnit) {
    // APARTMENT_PG: caller must select a unit first (see loadUnitsOnFloor + loadRoomBedGroupsForUnit).
    return [];
  }

  return [];
}

export function browseUsesApartmentUnitPicker(building: BuildingResponse): boolean {
  return building.layoutMode === 'APARTMENT_PG';
}

export async function loadUnitsOnFloor(
  spaceId: string,
  buildingId: string,
  floorId: string,
): Promise<UnitListItemResponse[]> {
  const page = await accommodationApi.listUnitsByFloor(spaceId, buildingId, floorId, {
    view: 'summary',
    size: 100,
  });
  return page.content.filter(item => !item.synthetic);
}

export async function loadRoomBedGroupsForUnit(
  spaceId: string,
  building: BuildingResponse,
  unit: { unitId: string; unitName: string },
  floor?: { floorId: string; floorName: string },
): Promise<OccupancyBrowseRoomGroup[]> {
  const roomsPage = await accommodationApi.listRoomsByUnit(spaceId, unit.unitId, {
    view: 'summary',
    size: 100,
  });
  const rooms = roomsPage.content.filter(item => item.availableBeds > 0);
  const groups = await Promise.all(
    rooms.map(room =>
      loadBedsForRoom(spaceId, building, {
        roomId: room.roomId,
        name: room.name,
        roomType: room.roomType,
        bedCount: room.bedCount,
        availableBeds: room.availableBeds,
        unitId: unit.unitId,
        unitName: unit.unitName,
        floorId: floor?.floorId,
        floorName: floor?.floorName,
      }),
    ),
  );
  return groups.filter((group): group is OccupancyBrowseRoomGroup => group !== null);
}

export async function loadRoomBedGroupsForBuilding(
  spaceId: string,
  spaceType: SpaceType,
  building: BuildingResponse,
  unitId?: string,
): Promise<OccupancyBrowseRoomGroup[]> {
  const profile = getAccommodationUiProfile(spaceType, building.layoutMode);
  if (!profile?.showBeds) {
    return [];
  }

  const groups: OccupancyBrowseRoomGroup[] = [];

  if (unitId && profile.showRoomsUnderUnit) {
    const unitsPage = await accommodationApi.listUnits(spaceId, building.buildingId, {
      view: 'summary',
      size: 100,
    });
    const unit = unitsPage.content.find(item => item.unitId === unitId);
    if (!unit) {
      return [];
    }
    return loadRoomBedGroupsForUnit(spaceId, building, {
      unitId,
      unitName: unit.name,
    });
  }

  // Whole-building scans are intentionally avoided — use loadRoomBedGroupsForFloor per floor.

  if (profile.showUnits && profile.showRoomsUnderUnit) {
    const unitsPage = await accommodationApi.listUnits(spaceId, building.buildingId, {
      view: 'summary',
      size: 100,
    });
    for (const unit of unitsPage.content.filter(item => !item.synthetic)) {
      const unitGroups = await loadRoomBedGroupsForBuilding(
        spaceId,
        spaceType,
        building,
        unit.unitId,
      );
      groups.push(...unitGroups);
    }
  }

  return groups;
}

export async function loadAvailableUnitsForBuilding(
  spaceId: string,
  building: BuildingResponse,
): Promise<OccupancyBrowseUnitItem[]> {
  const page = await accommodationApi.listUnits(spaceId, building.buildingId, {
    view: 'summary',
    size: 100,
  });
  return page.content
    .filter(unit => !unit.synthetic && unit.status === 'AVAILABLE')
    .map(unit => ({
      unitId: unit.unitId,
      unitName: unit.name,
      status: unit.status,
      selection: {
        targetType: 'UNIT',
        buildingId: building.buildingId,
        buildingName: building.name,
        unitId: unit.unitId,
        unitName: unit.name,
      },
    }));
}

export async function loadCoLivingUnitsForBuilding(
  spaceId: string,
  building: BuildingResponse,
): Promise<UnitListItemResponse[]> {
  const page = await accommodationApi.listUnits(spaceId, building.buildingId, {
    view: 'summary',
    size: 100,
  });
  return page.content.filter(unit => !unit.synthetic);
}

export function formatOccupancySearchResultTitle(
  result: OccupancySearchResult,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (result.bedName && result.roomName) {
    return t('occupancy.picker.searchResultBed', {
      room: result.roomName,
      bed: result.bedName,
    });
  }
  if (result.roomName) {
    return result.roomName;
  }
  if (result.unitName) {
    return result.unitName;
  }
  return result.buildingName;
}

export function formatOccupancySearchResultSubtitle(result: OccupancySearchResult): string {
  return [
    result.buildingName,
    result.floorName,
    result.unitName,
    result.roomName && !result.bedName ? result.roomName : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function formatOccupancyTargetLines(
  selection: OccupancyTargetSelection,
): string[] {
  const lines: string[] = [selection.buildingName];
  if (selection.floorName) {
    lines.push(selection.floorName);
  }
  if (selection.unitName) {
    lines.push(selection.unitName);
  }
  if (selection.roomName) {
    lines.push(selection.roomName);
  }
  if (selection.bedName) {
    lines.push(selection.bedName);
  }
  return lines;
}

export function browseUsesRoomGroups(spaceType: SpaceType, building: BuildingResponse): boolean {
  const allowed = getAllowedTargetTypes(spaceType);
  if (!allowed.includes('BED')) {
    return false;
  }
  const profile = getAccommodationUiProfile(spaceType, building.layoutMode);
  return Boolean(profile?.showBeds);
}

export function browseUsesUnitsOnly(spaceType: SpaceType, building: BuildingResponse): boolean {
  const allowed = getAllowedTargetTypes(spaceType);
  if (!allowed.includes('UNIT') || allowed.includes('BED')) {
    return false;
  }
  const profile = getAccommodationUiProfile(spaceType, building.layoutMode);
  return Boolean(profile?.showUnits && !profile.showBeds);
}

export function browseUsesCoLivingUnits(spaceType: SpaceType, building: BuildingResponse): boolean {
  const profile = getAccommodationUiProfile(spaceType, building.layoutMode);
  return spaceType === 'CO_LIVING' && Boolean(profile?.showUnits && profile.showBeds);
}
