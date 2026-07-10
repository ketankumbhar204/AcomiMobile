import type { MealComboResponse } from '../api/types';
import type { MenuAdHocPackage, MenuSelectionItemPackage } from './dailyMenuDraft';
import { getEffectivePriceDraft, hasComboPrice, parsePriceInput } from './comboPrice';

export type MenuSelectionSnapshot = {
  combos: MealComboResponse[];
  itemPackages: MenuSelectionItemPackage[];
  adHocPackages: MenuAdHocPackage[];
};

export function isMenuSelectionFullyResolved(
  selectedComboIds: string[],
  selectedItemIds: string[],
  combos: MealComboResponse[],
  draftPrices: Record<string, string>,
  adHocPackages: MenuAdHocPackage[],
  requiresMealPrices = true,
): boolean {
  for (const comboId of selectedComboIds) {
    const combo = combos.find(row => row.comboId === comboId);
    if (!combo) {
      return false;
    }
  }

  if (!requiresMealPrices) {
    return true;
  }

  for (const comboId of selectedComboIds) {
    const combo = combos.find(row => row.comboId === comboId);
    if (!combo) {
      return false;
    }
    if (hasComboPrice(combo.price)) {
      continue;
    }
    const draft = getEffectivePriceDraft(comboId, draftPrices, combo.price);
    if (parsePriceInput(draft) == null) {
      return false;
    }
  }

  for (const itemId of selectedItemIds) {
    const draft = getEffectivePriceDraft(itemId, draftPrices, null);
    if (parsePriceInput(draft) == null) {
      return false;
    }
  }

  for (const pkg of adHocPackages) {
    if (pkg.price == null || pkg.price <= 0) {
      return false;
    }
  }

  return true;
}
