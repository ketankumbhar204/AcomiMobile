import { spaceApi } from '../api/spaceApi';
import type { SpaceType, UUID } from '../api/types';

export type SpaceFoodPolicy = {
  foodIncludedInRent: boolean;
  defaultFoodCharge: number | null;
};

const ACCOMMODATION_FOOD_SPACE_TYPES: SpaceType[] = ['PG', 'HOSTEL'];

export function resolveSpaceFoodPolicy(space: {
  foodIncludedInRent?: boolean;
  defaultFoodCharge?: number | null;
  type?: SpaceType;
}): SpaceFoodPolicy {
  const defaultFoodCharge =
    space.defaultFoodCharge != null && space.defaultFoodCharge > 0
      ? space.defaultFoodCharge
      : null;

  if (space.foodIncludedInRent) {
    return {
      foodIncludedInRent: true,
      defaultFoodCharge: null,
    };
  }

  const usesAccommodationFood =
    space.type != null && ACCOMMODATION_FOOD_SPACE_TYPES.includes(space.type);

  if (usesAccommodationFood && defaultFoodCharge == null) {
    return {
      foodIncludedInRent: true,
      defaultFoodCharge: null,
    };
  }

  return {
    foodIncludedInRent: false,
    defaultFoodCharge,
  };
}

export async function fetchSpaceFoodPolicy(spaceId: UUID): Promise<SpaceFoodPolicy> {
  const space = await spaceApi.getSpaceById(spaceId);
  return resolveSpaceFoodPolicy(space);
}
