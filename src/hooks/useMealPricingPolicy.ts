import { useMemo } from 'react';
import type { UUID } from '../api/types';
import { useSpaceStore } from '../store/spaceStore';
import { useSpacePermissions } from './useSpacePermissions';
import {
  mealPricingContextFromSpace,
  mealPricingContextFromSpaceType,
  requiresMealPrices,
  showMealPrices,
  usesSeparateMealBilling,
  type MealPricingContext,
} from '../utils/mealPricingPolicy';

export function useMealPricingPolicy(spaceId?: UUID | null) {
  const { spaceType } = useSpacePermissions(spaceId);
  const selectedSpace = useSpaceStore(state => state.selectedSpace);

  const context = useMemo((): MealPricingContext => {
    if (selectedSpace && spaceId && selectedSpace.id === spaceId) {
      return mealPricingContextFromSpace(selectedSpace);
    }
    return mealPricingContextFromSpaceType(spaceType);
  }, [selectedSpace, spaceId, spaceType]);

  return {
    ...context,
    usesSeparateMealBilling: usesSeparateMealBilling(context),
    requiresMealPrices: requiresMealPrices(context),
    showMealPrices: showMealPrices(context),
  };
}
