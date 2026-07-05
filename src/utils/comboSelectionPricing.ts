import { mealsApi } from '../api/mealsApi';
import type { MealComboResponse, UUID } from '../api/types';
import { hasComboPrice, parsePriceInput, validatePriceInput, getEffectivePriceDraft } from './comboPrice';

export type ComboPriceDraftError = 'required' | 'invalid' | 'nonPositive';

export type ComboPriceDraftErrors = Record<string, ComboPriceDraftError>;

function priceDraftForCombo(combo: MealComboResponse, draftPrices: Record<string, string>): string {
  return getEffectivePriceDraft(combo.comboId, draftPrices, combo.price);
}

export async function persistComboPriceDraft(
  spaceId: UUID,
  combo: MealComboResponse,
  draftPrices: Record<string, string>,
): Promise<{ combo: MealComboResponse; error?: ComboPriceDraftError }> {
  const { updatedCombos, errors } = await applyDraftPricesToCombos(spaceId, [combo], draftPrices);
  const error = errors[combo.comboId];
  return {
    combo: updatedCombos[0] ?? combo,
    error,
  };
}

export async function applyDraftPricesToCombos(
  spaceId: UUID,
  combos: MealComboResponse[],
  draftPrices: Record<string, string>,
): Promise<{ updatedCombos: MealComboResponse[]; errors: ComboPriceDraftErrors }> {
  const errors: ComboPriceDraftErrors = {};
  const updatedCombos: MealComboResponse[] = [];

  for (const combo of combos) {
    const draft = priceDraftForCombo(combo, draftPrices);

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

    if (hasComboPrice(combo.price) && Number(combo.price) === price) {
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
