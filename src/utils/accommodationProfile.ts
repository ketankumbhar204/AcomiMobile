import type { PropertyLayoutMode, SpaceType } from '../api/types';



export interface AccommodationUiProfile {

  layoutMode: PropertyLayoutMode;

  showFloors: boolean;

  showUnits: boolean;

  showUnitsOnFloor: boolean;

  showRoomsUnderFloor: boolean;

  showRoomsUnderUnit: boolean;

  showBeds: boolean;

}



export function isAccommodationApplicable(spaceType: SpaceType): boolean {

  return spaceType !== 'MESS';

}

/** Menu and order dashboard widgets. Unknown or non-mess types do not show them. */
export function showsMessDashboardWidgets(
  spaceType: SpaceType | null | undefined,
): boolean {
  return spaceType === 'MESS';
}

/** Member dashboard meal-selection card. PG and Mess both plan and respond to menus. */
export function showsMemberMealSelectionCard(
  spaceType: SpaceType | null | undefined,
): boolean {
  return spaceType === 'MESS' || spaceType === 'PG';
}



export function defaultLayoutModeForSpaceType(spaceType: SpaceType): PropertyLayoutMode {

  switch (spaceType) {

    case 'PG':

    case 'HOSTEL':

      return 'CORRIDOR_PG';

    case 'CO_LIVING':

      return 'CO_LIVING';

    case 'RENTAL':

    case 'CORPORATE_STAY':

      return 'RENTAL';

    default:

      return 'CORRIDOR_PG';

  }

}



export function getAccommodationUiProfile(

  spaceType: SpaceType,

  layoutMode?: PropertyLayoutMode | null,

): AccommodationUiProfile | null {

  if (spaceType === 'MESS') {

    return null;

  }



  const mode = layoutMode ?? defaultLayoutModeForSpaceType(spaceType);



  switch (mode) {

    case 'CORRIDOR_PG':

      return {

        layoutMode: mode,

        showFloors: true,

        showUnits: false,

        showUnitsOnFloor: false,

        showRoomsUnderFloor: true,

        showRoomsUnderUnit: false,

        showBeds: true,

      };

    case 'APARTMENT_PG':

      return {

        layoutMode: mode,

        showFloors: true,

        showUnits: false,

        showUnitsOnFloor: true,

        showRoomsUnderFloor: false,

        showRoomsUnderUnit: true,

        showBeds: true,

      };

    case 'CO_LIVING':

      return {

        layoutMode: mode,

        showFloors: false,

        showUnits: true,

        showUnitsOnFloor: false,

        showRoomsUnderFloor: false,

        showRoomsUnderUnit: true,

        showBeds: true,

      };

    case 'RENTAL':

      return {

        layoutMode: mode,

        showFloors: false,

        showUnits: true,

        showUnitsOnFloor: false,

        showRoomsUnderFloor: false,

        showRoomsUnderUnit: false,

        showBeds: false,

      };

    default:

      return null;

  }

}



/** @deprecated Use getAccommodationUiProfile(spaceType, layoutMode) */

export function getAccommodationUiProfileBySpaceType(

  spaceType: SpaceType,

): AccommodationUiProfile | null {

  return getAccommodationUiProfile(spaceType);

}

export type BuildingSummaryCountPart = 'floors' | 'units' | 'rooms' | 'beds';

/**
 * Header counts follow the layout profile. Corridor and apartment keep the
 * existing floors · rooms · beds line. Rental and corporate stay (RENTAL
 * layout) show units only. Co-living shows units, rooms, and beds.
 */
export function visibleBuildingSummaryParts(
  profile: AccommodationUiProfile,
): 'combinedFloorsRoomsBeds' | BuildingSummaryCountPart[] {
  const showRooms = profile.showRoomsUnderFloor || profile.showRoomsUnderUnit;
  if (profile.showFloors && showRooms && profile.showBeds) {
    return 'combinedFloorsRoomsBeds';
  }
  const parts: BuildingSummaryCountPart[] = [];
  if (profile.showFloors) {
    parts.push('floors');
  }
  if (profile.showUnits) {
    parts.push('units');
  }
  if (showRooms) {
    parts.push('rooms');
  }
  if (profile.showBeds) {
    parts.push('beds');
  }
  return parts;
}

/**
 * Rental and corporate stay use units only. PG, hostel, and co-living keep
 * rooms and beds. A zero count is not used here — only the layout profile.
 */
export function usesUnitLevelOccupancy(
  profile: AccommodationUiProfile | null | undefined,
): boolean {
  return Boolean(
    profile &&
      profile.showUnits &&
      !profile.showBeds &&
      !profile.showRoomsUnderUnit &&
      !profile.showRoomsUnderFloor,
  );
}

/** Confirm and overview lines omit entities whose count is zero. */
export function visiblePositiveStructureCounts(totals: {
  floors: number;
  units: number;
  rooms: number;
  beds: number;
}): BuildingSummaryCountPart[] {
  return (['floors', 'units', 'rooms', 'beds'] as const).filter(key => totals[key] > 0);
}


