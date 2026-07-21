import type { FoodItemResponse, MealComboResponse } from '../api/types';
import { getEffectivePriceDraft, validatePriceInput } from './comboPrice';
import type { ComboPriceDraftError, ComboPriceDraftErrors } from './comboSelectionPricing';
import type { MenuAdHocPackage } from './dailyMenuDraft';
import { extraItemDraftId } from './dailyMenuDraft';
import type { MenuSelectionTab } from '../components/meals/MenuSelectionTabBar';

function draftError(draft: string, requirePrices: boolean): ComboPriceDraftError | null {
  const trimmed = draft.trim();
  if (!trimmed) {
    return requirePrices ? 'required' : null;
  }
  const validation = validatePriceInput(trimmed);
  if (validation === 'invalid' || validation === 'nonPositive') {
    return validation;
  }
  return null;
}

/**
 * Collects price-field errors for currently selected Mess menu options.
 * Keys match ComboPickerCard draft ids (comboId / itemId / extra:itemId / package:label).
 */
export function collectSelectionPriceErrors(args: {
  requiresMealPrices: boolean;
  selectedCombos: MealComboResponse[];
  selectedItems: FoodItemResponse[];
  selectedExtras?: FoodItemResponse[];
  adHocPackages: MenuAdHocPackage[];
  draftPrices: Record<string, string>;
}): ComboPriceDraftErrors {
  if (!args.requiresMealPrices) {
    return {};
  }

  const errors: ComboPriceDraftErrors = {};

  for (const combo of args.selectedCombos) {
    const draft = getEffectivePriceDraft(combo.comboId, args.draftPrices, combo.price);
    const error = draftError(draft, true);
    if (error) {
      errors[combo.comboId] = error;
    }
  }

  for (const item of args.selectedItems) {
    const draft = getEffectivePriceDraft(
      item.itemId,
      args.draftPrices,
      item.defaultPrice ?? null,
    );
    const error = draftError(draft, true);
    if (error) {
      errors[item.itemId] = error;
    }
  }

  for (const item of args.selectedExtras ?? []) {
    const draftId = extraItemDraftId(item.itemId);
    const draft = getEffectivePriceDraft(draftId, args.draftPrices, item.defaultPrice ?? null);
    const error = draftError(draft, true);
    if (error) {
      errors[draftId] = error;
    }
  }

  for (const pkg of args.adHocPackages) {
    const id = `package:${pkg.label}`;
    const draft = getEffectivePriceDraft(id, args.draftPrices, pkg.price);
    const error = draftError(draft, true);
    if (error) {
      errors[id] = error;
    }
  }

  return errors;
}

export function firstPriceErrorTarget(
  errors: ComboPriceDraftErrors,
  selectedComboIds: string[],
  selectedItemIds: string[],
  _selectedExtraIds: string[] = [],
): { id: string; tab: MenuSelectionTab } | null {
  const ids = Object.keys(errors);
  if (ids.length === 0) {
    return null;
  }
  const comboHit = selectedComboIds.find(id => errors[id]);
  if (comboHit) {
    return { id: comboHit, tab: 'combos' };
  }
  const itemHit = selectedItemIds.find(id => errors[id]);
  if (itemHit) {
    return { id: itemHit, tab: 'items' };
  }
  return { id: ids[0], tab: 'combos' };
}
