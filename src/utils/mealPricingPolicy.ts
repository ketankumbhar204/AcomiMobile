import type { SpaceType } from '../api/types';
import { resolveSpaceFoodPolicy } from './fetchSpaceFoodPolicy';

export type MealPricingContext = {
  spaceType?: SpaceType;
  foodIncludedInRent?: boolean;
};

/**
 * MESS bills meals separately with visible per-item prices.
 * Accommodation spaces (PG / Hostel / Co-living) use polls for headcount only;
 * food is covered by the monthly rent contract.
 */
export function usesSeparateMealBilling(ctx: MealPricingContext): boolean {
  return ctx.spaceType === 'MESS';
}

export function requiresMealPrices(ctx: MealPricingContext): boolean {
  return usesSeparateMealBilling(ctx);
}

export function showMealPrices(ctx: MealPricingContext): boolean {
  return usesSeparateMealBilling(ctx);
}

export function mealPricingContextFromSpace(space: {
  type?: SpaceType;
  spaceType?: SpaceType;
  foodIncludedInRent?: boolean;
  defaultFoodCharge?: number | null;
}): MealPricingContext {
  const spaceType = space.spaceType ?? space.type;
  const policy = resolveSpaceFoodPolicy({
    type: spaceType,
    foodIncludedInRent: space.foodIncludedInRent,
    defaultFoodCharge: space.defaultFoodCharge,
  });
  return {
    spaceType,
    foodIncludedInRent: policy.foodIncludedInRent,
  };
}

export function mealPricingContextFromSpaceType(spaceType?: SpaceType): MealPricingContext {
  return { spaceType };
}
