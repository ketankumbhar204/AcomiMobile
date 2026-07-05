import type { OccupancyHierarchyContext } from '../components/occupancy/HierarchyBreadcrumbCard';
import type { HierarchyOccupancyScope, HierarchyStep } from './hierarchyOccupancySteps';
import type { OccupancyTargetSelection } from './occupancyRules';
import type { FloorListItemResponse, PropertyLayoutMode, SpaceType, UnitListItemResponse } from '../api/types';
import type { OccupancyBrowseRoomGroup, OccupancyBrowseBedItem } from './occupancyBrowse';
import { getLayoutModeLabelKey } from './propertyLayoutMode';
import { getSpaceTypeLabel } from '../api/spaceTypes';
import type { TFunction } from 'i18next';

export function resolveOccupancySpaceTypeLabel(
  spaceType: SpaceType,
  layoutMode: PropertyLayoutMode | null | undefined,
  t: TFunction,
): string {
  if (layoutMode) {
    return t(getLayoutModeLabelKey(layoutMode));
  }
  return getSpaceTypeLabel(spaceType);
}

export function withSpaceHierarchyContext(
  context: OccupancyHierarchyContext,
  spaceName?: string,
  spaceTypeLabel?: string,
): OccupancyHierarchyContext {
  return {
    ...context,
    ...(spaceName ? { spaceName } : {}),
    ...(spaceTypeLabel ? { spaceTypeLabel } : {}),
  };
}

type FlowPhase = 'hierarchy' | 'member' | 'contract' | 'reserve_dates' | 'review';

export function buildConfirmedHierarchyContext(
  scope: HierarchyOccupancyScope,
  buildingName: string | undefined,
  selections: {
    floor?: FloorListItemResponse | null;
    unit?: UnitListItemResponse | null;
    room?: OccupancyBrowseRoomGroup | null;
  },
  options: {
    phase: FlowPhase;
    currentHierarchyStep?: HierarchyStep | null;
    activeTarget?: OccupancyTargetSelection | null;
  },
): OccupancyHierarchyContext {
  if (options.phase !== 'hierarchy' && options.activeTarget) {
    return hierarchyContextFromTarget(options.activeTarget);
  }

  const ctx: OccupancyHierarchyContext = {
    buildingName: buildingName ?? scope.buildingName,
  };

  const floorName = selections.floor?.name ?? scope.floorName;
  const unitName = selections.unit?.name ?? scope.unitName;
  const roomName = selections.room?.roomName ?? scope.roomName;
  const step = options.currentHierarchyStep;

  if (!step) {
    return ctx;
  }

  switch (step) {
    case 'floor':
      break;
    case 'unit':
      if (floorName) {
        ctx.floorName = floorName;
      }
      break;
    case 'room':
      if (floorName) {
        ctx.floorName = floorName;
      }
      if (unitName) {
        ctx.unitName = unitName;
      }
      break;
    case 'bed':
      if (floorName) {
        ctx.floorName = floorName;
      }
      if (unitName) {
        ctx.unitName = unitName;
      }
      if (roomName) {
        ctx.roomName = roomName;
      }
      break;
    default:
      break;
  }

  return ctx;
}

export function mergeHierarchyContext(
  scope: HierarchyOccupancyScope,
  buildingName?: string,
  selected?: {
    floor?: FloorListItemResponse | null;
    unit?: UnitListItemResponse | null;
    room?: OccupancyBrowseRoomGroup | null;
    beds?: OccupancyBrowseBedItem[];
  },
): OccupancyHierarchyContext {
  return {
    buildingName: buildingName ?? scope.buildingName,
    floorName: selected?.floor?.name ?? scope.floorName,
    unitName: selected?.unit?.name ?? scope.unitName,
    roomName: selected?.room?.roomName ?? scope.roomName,
    bedName: selected?.beds?.[0]?.label,
  };
}

export function hierarchyContextFromTarget(
  target: OccupancyTargetSelection | null | undefined,
): OccupancyHierarchyContext {
  if (!target) {
    return {};
  }
  return {
    buildingName: target.buildingName,
    floorName: target.floorName,
    unitName: target.unitName,
    roomName: target.roomName,
    bedName: target.bedName,
  };
}

export function hierarchyContextFromScope(
  scope: HierarchyOccupancyScope,
  buildingName?: string,
  activeTarget?: OccupancyTargetSelection | null,
): OccupancyHierarchyContext {
  if (activeTarget) {
    return hierarchyContextFromTarget(activeTarget);
  }
  return {
    buildingName: buildingName ?? scope.buildingName,
    floorName: scope.floorName,
    unitName: scope.unitName,
    roomName: scope.roomName,
  };
}
