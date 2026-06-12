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



export function defaultLayoutModeForSpaceType(spaceType: SpaceType): PropertyLayoutMode {

  switch (spaceType) {

    case 'PG':

    case 'HOSTEL':

      return 'CORRIDOR_PG';

    case 'CO_LIVING':

      return 'CO_LIVING';

    case 'RENTAL':

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


