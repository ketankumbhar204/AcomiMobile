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

  if (spaceType === 'RENTAL') {
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

export function getPostHierarchyWizardSteps(
  mode: 'ALLOCATE' | 'RESERVE',
): Array<'member' | 'contract' | 'reserve_dates' | 'review'> {
  if (mode === 'RESERVE') {
    return ['member', 'reserve_dates', 'review'];
  }
  return ['member', 'contract', 'review'];
}

export function getTotalAllocationFlowSteps(
  hierarchySteps: HierarchyStep[],
  mode: 'ALLOCATE' | 'RESERVE',
): number {
  return hierarchySteps.length + getPostHierarchyWizardSteps(mode).length;
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
