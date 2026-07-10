import type { FoodItemResponse } from '../../api/types';
import { getEffectivePriceDraft, hasComboPrice } from '../comboPrice';
import { persistItemPriceDraft } from '../itemSelectionPricing';

jest.mock('../../api/mealsApi', () => ({
  mealsApi: {
    updateFoodItemDefaultPrice: jest.fn(),
  },
}));

import { mealsApi } from '../../api/mealsApi';

const mockedUpdate = mealsApi.updateFoodItemDefaultPrice as jest.Mock;

const item: FoodItemResponse = {
  itemId: 'item-1',
  categoryId: 'cat-1',
  name: 'Poha',
  scope: 'GLOBAL',
  isCustom: false,
  isActive: true,
  defaultPrice: null,
  currencyCode: 'INR',
};

describe('persistItemPriceDraft', () => {
  beforeEach(() => {
    mockedUpdate.mockReset();
  });

  it('persists new default price on blur', async () => {
    mockedUpdate.mockResolvedValue({ ...item, defaultPrice: 30 });

    const result = await persistItemPriceDraft('space-1', item, { 'item-1': '30' });

    expect(mockedUpdate).toHaveBeenCalledWith('space-1', 'item-1', {
      price: 30,
      currencyCode: 'INR',
    });
    expect(result.item.defaultPrice).toBe(30);
    expect(result.error).toBeUndefined();
  });

  it('skips API when price unchanged', async () => {
    const pricedItem = { ...item, defaultPrice: 30 };
    const result = await persistItemPriceDraft('space-1', pricedItem, { 'item-1': '30' });

    expect(mockedUpdate).not.toHaveBeenCalled();
    expect(result.error).toBeUndefined();
  });

  it('updates library price when changed', async () => {
    mockedUpdate.mockResolvedValue({ ...item, defaultPrice: 35 });
    const pricedItem = { ...item, defaultPrice: 30 };

    const result = await persistItemPriceDraft('space-1', pricedItem, { 'item-1': '35' });

    expect(mockedUpdate).toHaveBeenCalledWith('space-1', 'item-1', {
      price: 35,
      currencyCode: 'INR',
    });
    expect(result.item.defaultPrice).toBe(35);
  });
});

describe('item price prefill', () => {
  it('uses library default price in effective draft', () => {
    expect(getEffectivePriceDraft('item-1', {}, 30)).toBe('30');
    expect(hasComboPrice(30)).toBe(true);
  });
});
