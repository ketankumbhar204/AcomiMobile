import { mealsApi } from '../api/mealsApi';
import type { DailyMenuOptionResponse, MealComboResponse, UUID } from '../api/types';

function inferOptionEntryType(
  option: DailyMenuOptionResponse,
): 'COMBO' | 'ITEM' | 'PACKAGE' {
  if (option.entryType === 'COMBO' || option.entryType === 'ITEM' || option.entryType === 'PACKAGE') {
    return option.entryType;
  }
  if (option.comboId) {
    return 'COMBO';
  }
  if (option.itemId) {
    return 'ITEM';
  }
  return 'PACKAGE';
}

export function isSingleItemMenuOption(option: DailyMenuOptionResponse): boolean {
  const entryType = inferOptionEntryType(option);
  if (entryType === 'ITEM') {
    return true;
  }
  if (entryType === 'PACKAGE') {
    const count = option.packageItems?.length ?? (option.itemId ? 1 : 0);
    return count <= 1;
  }
  return false;
}

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
  const entryType = inferOptionEntryType(option);
  if ((entryType === 'ITEM' || entryType === 'PACKAGE') && option.label.trim()) {
    return [option.label.trim()];
  }
  return [];
}

export async function resolveMenuOptionItemNames(
  spaceId: UUID,
  option: DailyMenuOptionResponse,
  comboById: Map<string, MealComboResponse>,
): Promise<string[]> {
  const immediate = getMenuOptionItemNames(option, comboById);
  if (immediate.length > 0) {
    return immediate;
  }

  const entryType = inferOptionEntryType(option);

  if (entryType === 'COMBO' && option.comboId) {
    const combos = await mealsApi.getMealCombos(spaceId);
    const combo = combos.find(row => row.comboId === option.comboId);
    return combo?.items?.map(item => item.name).filter(Boolean) ?? [];
  }

  if (entryType === 'PACKAGE') {
    const ids =
      option.itemIds ??
      option.packageItems?.map(item => item.itemId).filter((id): id is string => Boolean(id)) ??
      [];
    if (ids.length === 0) {
      return [];
    }
    const items = await mealsApi.getFoodItems(spaceId);
    const byId = new Map(items.map(item => [item.itemId, item.name]));
    return ids.map(id => byId.get(id)).filter((name): name is string => Boolean(name));
  }

  return immediate;
}
