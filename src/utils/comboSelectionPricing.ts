import { mealsApi } from '../api/mealsApi';
import { ApiError } from '../api/types';
import type { MealComboResponse, UUID } from '../api/types';
import { agentDebugLog } from './agentDebugLog';
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
  options?: { requirePrices?: boolean },
): Promise<{ updatedCombos: MealComboResponse[]; errors: ComboPriceDraftErrors }> {
  const requirePrices = options?.requirePrices ?? true;
  const errors: ComboPriceDraftErrors = {};
  const updatedCombos: MealComboResponse[] = [];

  for (const combo of combos) {
    const draft = priceDraftForCombo(combo, draftPrices);

    if (!draft) {
      if (requirePrices) {
        errors[combo.comboId] = 'required';
      }
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

    agentDebugLog({
      hypothesisId: 'A',
      location: 'comboSelectionPricing.ts:applyDraftPricesToCombos',
      message: 'Saving space-scoped combo price',
      data: {
        spaceId,
        comboId: combo.comboId,
        comboName: combo.name,
        previousPrice: combo.price ?? null,
        nextPrice: price,
      },
    });

    try {
      const updated = await mealsApi.updateMealComboPrice(spaceId, combo.comboId, {
        price,
        currencyCode: combo.currencyCode ?? 'INR',
      });
      agentDebugLog({
        hypothesisId: 'E',
        location: 'comboSelectionPricing.ts:applyDraftPricesToCombos',
        message: 'Combo price save succeeded',
        data: {
          spaceId,
          comboId: updated.comboId,
          savedPrice: updated.price ?? null,
        },
      });
      updatedCombos.push(updated);
    } catch (error) {
      agentDebugLog({
        hypothesisId: 'C',
        location: 'comboSelectionPricing.ts:applyDraftPricesToCombos',
        message: 'Combo price save failed',
        data: {
          spaceId,
          comboId: combo.comboId,
          attemptedPrice: price,
          apiStatus: error instanceof ApiError ? error.status : null,
          apiMessage: error instanceof ApiError ? error.message : String(error),
        },
      });
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
