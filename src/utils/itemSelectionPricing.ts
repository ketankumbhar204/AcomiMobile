import { mealsApi } from '../api/mealsApi';
import { ApiError } from '../api/types';
import type { FoodItemResponse, UUID } from '../api/types';
import { agentDebugLog } from './agentDebugLog';
import { getEffectivePriceDraft, hasComboPrice, parsePriceInput, validatePriceInput } from './comboPrice';
import type { ComboPriceDraftError } from './comboSelectionPricing';

export async function persistItemPriceDraft(
  spaceId: UUID,
  item: FoodItemResponse,
  draftPrices: Record<string, string>,
  options?: { requirePrices?: boolean },
): Promise<{ item: FoodItemResponse; error?: ComboPriceDraftError }> {
  const requirePrices = options?.requirePrices ?? true;
  const draft = getEffectivePriceDraft(item.itemId, draftPrices, item.defaultPrice ?? null);

  if (!draft) {
    return requirePrices ? { item, error: 'required' } : { item };
  }

  const validation = validatePriceInput(draft);
  if (validation === 'invalid' || validation === 'nonPositive') {
    return { item, error: validation };
  }

  const price = parsePriceInput(draft);
  if (price == null) {
    return { item, error: 'invalid' };
  }

  if (hasComboPrice(item.defaultPrice) && Number(item.defaultPrice) === price) {
    return { item };
  }

  agentDebugLog({
    hypothesisId: 'A',
    location: 'itemSelectionPricing.ts:persistItemPriceDraft',
    message: 'Saving space-scoped item default price',
    data: {
      spaceId,
      itemId: item.itemId,
      itemName: item.name,
      previousPrice: item.defaultPrice ?? null,
      nextPrice: price,
    },
  });

  try {
    const updated = await mealsApi.updateFoodItemDefaultPrice(spaceId, item.itemId, {
      price,
      currencyCode: item.currencyCode ?? 'INR',
    });
    agentDebugLog({
      hypothesisId: 'E',
      location: 'itemSelectionPricing.ts:persistItemPriceDraft',
      message: 'Item default price save succeeded',
      data: {
        spaceId,
        itemId: updated.itemId,
        savedPrice: updated.defaultPrice ?? null,
      },
    });
    return { item: updated };
  } catch (error) {
    agentDebugLog({
      hypothesisId: 'C',
      location: 'itemSelectionPricing.ts:persistItemPriceDraft',
      message: 'Item default price save failed',
      data: {
        spaceId,
        itemId: item.itemId,
        attemptedPrice: price,
        apiStatus: error instanceof ApiError ? error.status : null,
        apiMessage: error instanceof ApiError ? error.message : String(error),
      },
    });
    return { item, error: 'invalid' };
  }
}
