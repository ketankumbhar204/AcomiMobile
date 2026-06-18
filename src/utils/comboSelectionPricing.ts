import { mealsApi } from '../api/mealsApi';
import type { MealComboResponse, UUID } from '../api/types';
import { hasComboPrice, parsePriceInput, validatePriceInput } from './comboPrice';

export type ComboPriceDraftError = 'required' | 'invalid' | 'nonPositive';

export type ComboPriceDraftErrors = Record<string, ComboPriceDraftError>;

export async function applyDraftPricesToCombos(
  spaceId: UUID,
  combos: MealComboResponse[],
  draftPrices: Record<string, string>,
): Promise<{ updatedCombos: MealComboResponse[]; errors: ComboPriceDraftErrors }> {
  const errors: ComboPriceDraftErrors = {};
  const updatedCombos: MealComboResponse[] = [];

  for (const combo of combos) {
    if (hasComboPrice(combo.price)) {
      updatedCombos.push(combo);
      continue;
    }

    const draft = draftPrices[combo.comboId]?.trim() ?? '';
    if (!draft) {
      errors[combo.comboId] = 'required';
      updatedCombos.push(combo);
      continue;
    }

    const validation = validatePriceInput(draft);
    if (validation === 'invalid' || validation === 'nonPositive') {
      errors[combo.comboId] = validation;
      updatedCombos.push(combo);
      continue;
    }

    const price = parsePriceInput(draft);
    if (price == null) {
      errors[combo.comboId] = 'invalid';
      updatedCombos.push(combo);
      continue;
    }

    try {
      const updated = await mealsApi.updateMealCombo(spaceId, combo.comboId, {
        name: combo.name,
        itemIds: combo.items?.map(item => item.itemId) ?? [],
        price,
        currencyCode: combo.currencyCode ?? 'INR',
      });
      updatedCombos.push(updated);
    } catch {
      errors[combo.comboId] = 'invalid';
      updatedCombos.push(combo);
    }
  }

  return { updatedCombos, errors };
}

export function comboPriceDraftErrorMessage(
  error: ComboPriceDraftError,
  t: (key: string) => string,
): string {
  if (error === 'required') {
    return t('meals.pricing.priceRequiredInline');
  }
  if (error === 'nonPositive') {
    return t('meals.pricing.priceMustBePositive');
  }
  return t('meals.pricing.priceInvalid');
}
