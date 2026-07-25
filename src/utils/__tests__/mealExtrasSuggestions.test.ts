import type { FoodItemResponse, MealComboResponse } from '../../api/types';
import {
  buildMealExtraSuggestionBuckets,
  collectMealExtraCategorySeedIds,
  collectSelectedMealItemIds,
} from '../mealExtrasSuggestions';
import type { MenuDraftOption } from '../dailyMenuDraft';

function item(
  overrides: Partial<FoodItemResponse> & Pick<FoodItemResponse, 'itemId' | 'name'>,
): FoodItemResponse {
  return {
    categoryId: 'cat-1',
    categoryName: 'Mains',
    scope: 'SPACE',
    isCustom: true,
    foodType: 'VEG',
    defaultPrice: 20,
    currencyCode: 'INR',
    isActive: true,
    isExtra: false,
    ...overrides,
  };
}

describe('collectSelectedMealItemIds', () => {
  it('expands combo constituents only — not selected individual items', () => {
    const comboById = new Map<string, MealComboResponse>([
      [
        'combo-1',
        {
          comboId: 'combo-1',
          name: 'Dal Rice',
          price: null,
          currencyCode: 'INR',
          isActive: true,
          items: [
            { itemId: 'item-dal', name: 'Dal Fry', quantity: 1 },
            { itemId: 'item-rice', name: 'Plain Rice', quantity: 1 },
          ],
        },
      ],
    ]);
    const options: MenuDraftOption[] = [
      {
        optionId: null,
        entryType: 'COMBO',
        comboId: 'combo-1',
        itemId: null,
        label: 'Dal Rice',
        sortOrder: 0,
        isAvailable: true,
        isExtra: false,
        price: null,
        currencyCode: 'INR',
      },
      {
        optionId: null,
        entryType: 'PACKAGE',
        comboId: null,
        itemId: null,
        itemIds: ['item-gulab'],
        label: 'Gulab Jamun',
        sortOrder: 1,
        isAvailable: true,
        isExtra: false,
        price: 40,
        currencyCode: 'INR',
      },
    ];

    const ids = collectSelectedMealItemIds(options, comboById);
    expect([...ids].sort()).toEqual(['item-dal', 'item-rice']);
  });

  it('does not list selected individual items under extras', () => {
    const options: MenuDraftOption[] = [
      {
        optionId: null,
        entryType: 'PACKAGE',
        comboId: null,
        itemId: null,
        itemIds: ['item-main'],
        label: 'Chapati',
        sortOrder: 0,
        isAvailable: true,
        isExtra: false,
        price: 10,
        currencyCode: 'INR',
      },
      {
        optionId: null,
        entryType: 'PACKAGE',
        comboId: null,
        itemId: null,
        itemIds: ['item-extra'],
        label: 'Papad',
        sortOrder: 1,
        isAvailable: true,
        isExtra: true,
        price: 5,
        currencyCode: 'INR',
      },
    ];

    const ids = collectSelectedMealItemIds(options, new Map());
    expect([...ids]).toEqual([]);
  });

  it('seeds related-extra categories from individual mains without listing them', () => {
    const options: MenuDraftOption[] = [
      {
        optionId: null,
        entryType: 'PACKAGE',
        comboId: null,
        itemId: null,
        itemIds: ['item-gulab'],
        label: 'Gulab Jamun',
        sortOrder: 0,
        isAvailable: true,
        isExtra: false,
        price: 40,
        currencyCode: 'INR',
      },
    ];
    const seeds = collectMealExtraCategorySeedIds(options, new Map());
    expect([...seeds]).toEqual(['item-gulab']);
    expect([...collectSelectedMealItemIds(options, new Map())]).toEqual([]);
  });
});

describe('buildMealExtraSuggestionBuckets', () => {
  it('lists combo items that are not yet library extras as missing', () => {
    const catalog = [
      item({ itemId: 'item-dal', name: 'Dal Fry' }),
      item({ itemId: 'item-rice', name: 'Plain Rice' }),
      item({ itemId: 'item-papad', name: 'Papad', isExtra: true }),
    ];
    const selected = new Set(['item-dal', 'item-rice']);
    const buckets = buildMealExtraSuggestionBuckets(catalog, selected);

    expect(buckets.missing.map(row => row.itemId).sort()).toEqual([
      'item-dal',
      'item-rice',
    ]);
    expect(buckets.relevant).toHaveLength(0);
  });

  it('surfaces selected items already marked as extras in relevant', () => {
    const catalog = [
      item({ itemId: 'item-dal', name: 'Dal Fry', isExtra: true }),
      item({ itemId: 'item-rice', name: 'Plain Rice' }),
    ];
    const selected = new Set(['item-dal', 'item-rice']);
    const buckets = buildMealExtraSuggestionBuckets(catalog, selected);

    expect(buckets.relevant.map(row => row.itemId)).toEqual(['item-dal']);
    expect(buckets.missing.map(row => row.itemId)).toEqual(['item-rice']);
  });
});
