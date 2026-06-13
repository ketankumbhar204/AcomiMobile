import { spaceApi } from '../api/spaceApi';
import type { SpaceType, UUID } from '../api/types';

export type SpaceFoodPolicy = {
  foodIncludedInRent: boolean;
  defaultFoodCharge: number | null;
};

export function resolveSpaceFoodPolicy(space: {
  foodIncludedInRent?: boolean;
  defaultFoodCharge?: number | null;
  type?: SpaceType;
}): SpaceFoodPolicy {
  return {
    foodIncludedInRent: Boolean(space.foodIncludedInRent),
    defaultFoodCharge:
      space.defaultFoodCharge != null && space.defaultFoodCharge > 0
        ? space.defaultFoodCharge
        : null,
  };
}

export async function fetchSpaceFoodPolicy(spaceId: UUID): Promise<SpaceFoodPolicy> {
  const space = await spaceApi.getSpaceById(spaceId);
  return resolveSpaceFoodPolicy(space);
}
