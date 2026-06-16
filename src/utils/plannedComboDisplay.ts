import type { DailyMenuOptionResponse, MealComboResponse } from '../api/types';

export function getMenuOptionItemNames(
  option: DailyMenuOptionResponse,
  comboById: Map<string, MealComboResponse>,
): string[] {
  if (option.packageItems?.length) {
    return option.packageItems.map(item => item.name).filter(Boolean);
  }
  if (option.comboId) {
    return comboById.get(option.comboId)?.items?.map(item => item.name).filter(Boolean) ?? [];
  }
  return [];
}
