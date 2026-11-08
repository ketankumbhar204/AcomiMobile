import type { PropertyLayoutMode, SpaceType } from '../api/types';
import { getAccommodationUiProfile } from './accommodationProfile';

export type HierarchyOccupancyScope = {
  buildingId: string;
  buildingName: string;
  layoutMode?: PropertyLayoutMode;
  floorId?: string;
  floorName?: string;
  unitId?: string;
  unitName?: string;
  roomId?: string;
  roomName?: string;
};

export type HierarchyStep = 'floor' | 'unit' | 'room' | 'bed';

export function getHierarchySteps(
  spaceType: SpaceType,
  layoutMode: PropertyLayoutMode | undefined,
  scope: HierarchyOccupancyScope,
): HierarchyStep[] {
  const profile = getAccommodationUiProfile(spaceType, layoutMode ?? 'CORRIDOR_PG');
  if (!profile) {
    return [];
  }
  const steps: HierarchyStep[] = [];

  const unitOnly =
    spaceType === 'RENTAL' ||
    spaceType === 'CORPORATE_STAY' ||
    layoutMode === 'RENTAL';
  if (unitOnly) {
    if (!scope.unitId) {
      steps.push('unit');
    }
    return steps;
  }

  // Floor selection only when starting from building scope (no child entity pinned).
  if (profile.showFloors && !scope.floorId && !scope.unitId && !scope.roomId) {
    steps.push('floor');
  }

  const usesUnitsOnFloor = Boolean(profile.showUnitsOnFloor || profile.showUnits);
  if (usesUnitsOnFloor && !scope.unitId && !scope.roomId) {
    steps.push('unit');
  }

  if (profile.showBeds && !scope.roomId) {
    steps.push('room');
  }

  if (profile.showBeds) {
    steps.push('bed');
  }

  return steps;
}

export type PostHierarchyWizardStep =
  | 'member'
  | 'stay_type'
  | 'contract'
  | 'reserve_dates'
  | 'review';

export function getPostHierarchyWizardSteps(
  mode: 'ALLOCATE' | 'RESERVE',
  /** @deprecated shortStayEnabled is ignored; stay_type is always included. */
  _options: { shortStayEnabled?: boolean } = {},
): PostHierarchyWizardStep[] {
  // Stay type first so pricing/dates follow the chosen kind (same as OccupancyWizard).
  if (mode === 'RESERVE') {
    return ['stay_type', 'member', 'reserve_dates', 'contract', 'review'];
  }
  return ['stay_type', 'member', 'contract', 'review'];
}

export function getTotalAllocationFlowSteps(
  hierarchySteps: HierarchyStep[],
  mode: 'ALLOCATE' | 'RESERVE',
  /** @deprecated shortStayEnabled is ignored; stay_type is always included. */
  options: { shortStayEnabled?: boolean } = {},
): number {
  return hierarchySteps.length + getPostHierarchyWizardSteps(mode, options).length;
}

export function hierarchyStepTitleKey(step: HierarchyStep): string {
  switch (step) {
    case 'floor':
      return 'occupancy.hierarchy.selectFloor';
    case 'unit':
      return 'occupancy.hierarchy.selectUnit';
    case 'room':
      return 'occupancy.hierarchy.selectRoom';
    case 'bed':
      return 'occupancy.hierarchy.selectBed';
    default:
      return 'occupancy.hierarchy.selectBed';
  }
}
