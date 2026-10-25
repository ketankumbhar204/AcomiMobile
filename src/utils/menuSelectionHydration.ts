import type { FoodItemResponse, MealComboResponse } from '../api/types';
import type { MenuDraftOption } from './dailyMenuDraft';

/**
 * Saved menu rows become visible selections before the space catalog request
 * returns. Catalog rows replace these stubs; a later catalog response must not
 * drop an id the user still has selected.
 */
export function comboStubsFromOptions(options: MenuDraftOption[]): MealComboResponse[] {
  return options
    .filter(option => option.entryType === 'COMBO' && option.comboId)
    .map(option => ({
      comboId: option.comboId as string,
      name: option.label,
      isActive: true,
      price: option.price ?? null,
      currencyCode: option.currencyCode ?? 'INR',
      foodType: option.foodType ?? undefined,
      items: [],
    }));
}

export function itemStubsFromOptions(options: MenuDraftOption[]): FoodItemResponse[] {
  return options
    .filter(
      option =>
        option.entryType === 'PACKAGE' &&
        option.isExtra !== true &&
        option.itemIds?.length === 1 &&
        option.itemIds[0],
    )
    .map(option => ({
      itemId: option.itemIds![0] as string,
      categoryId: '',
      name: option.label,
      scope: 'SPACE',
      isCustom: false,
      isActive: true,
      foodType: option.foodType ?? undefined,
      defaultPrice: option.price ?? null,
      currencyCode: option.currencyCode ?? 'INR',
    }));
}

export function mergeCatalogRecords<T>(
  current: T[],
  catalog: T[],
  selectedIds: readonly string[],
  idOf: (row: T) => string,
): T[] {
  const catalogIds = new Set(catalog.map(idOf));
  const selected = new Set(selectedIds);
  const kept = current.filter(row => {
    const id = idOf(row);
    return selected.has(id) && !catalogIds.has(id);
  });
  return [...catalog, ...kept];
}

export function selectionSummaryCount(
  selectedComboIds: readonly string[],
  selectedItemIds: readonly string[],
  adHocCount: number,
): number {
  return selectedComboIds.length + selectedItemIds.length + adHocCount;
}
