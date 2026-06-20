import type { FoodItemResponse, FoodType } from '../api/types';

export const FOOD_TYPE_OPTIONS: FoodType[] = ['VEG', 'NON_VEG', 'EGG'];

export function foodTypeLabelKey(type: FoodType): string {
  if (type === 'NON_VEG') {
    return 'meals.foodType.nonVeg';
  }
  return `meals.foodType.${type.toLowerCase()}`;
}

export function resolveStrictestFoodType(
  types: Array<FoodType | null | undefined>,
): FoodType {
  if (types.some(type => type === 'NON_VEG')) {
    return 'NON_VEG';
  }
  if (types.some(type => type === 'EGG')) {
    return 'EGG';
  }
  return 'VEG';
}

export function resolveFoodTypeFromItems(
  items: FoodItemResponse[],
  selectedIds: string[],
): FoodType {
  const selected = items.filter(
    item => item.isActive && selectedIds.includes(item.itemId),
  );
  return resolveStrictestFoodType(selected.map(item => item.foodType));
}

export function usesNonVegIcon(type: FoodType | null | undefined): boolean {
  return type === 'NON_VEG' || type === 'EGG';
}
