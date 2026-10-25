import type { MealComboResponse } from '../../api/types';
import type { MenuDraftOption } from '../dailyMenuDraft';
import {
  comboStubsFromOptions,
  itemStubsFromOptions,
  mergeCatalogRecords,
  selectionSummaryCount,
} from '../menuSelectionHydration';

function comboOption(comboId: string, label: string): MenuDraftOption {
  return {
    entryType: 'COMBO',
    comboId,
    label,
    sortOrder: 1,
    isAvailable: true,
    price: 80,
    currencyCode: 'INR',
  };
}

function itemOption(itemId: string, label: string): MenuDraftOption {
  return {
    entryType: 'PACKAGE',
    itemIds: [itemId],
    label,
    sortOrder: 2,
    isAvailable: true,
    isExtra: false,
    price: 40,
  };
}

describe('menu selection hydration', () => {
  const saved = [
    comboOption('c1', 'Chicken Thali'),
    comboOption('c2', 'Dal Rice Combo'),
    comboOption('c3', 'Egg Combo'),
    comboOption('c4', 'Standard Lunch Thali'),
  ];

  it('hydrates the selected count and chips from a saved menu before the catalog loads', () => {
    const stubs = comboStubsFromOptions(saved);
    const ids = stubs.map(combo => combo.comboId);
    expect(selectionSummaryCount(ids, [], 0)).toBe(4);
    expect(stubs.map(combo => combo.name)).toEqual([
      'Chicken Thali',
      'Dal Rice Combo',
      'Egg Combo',
      'Standard Lunch Thali',
    ]);
    expect(itemStubsFromOptions([itemOption('i1', 'Plain Rice')])).toEqual([
      expect.objectContaining({ itemId: 'i1', name: 'Plain Rice', defaultPrice: 40 }),
    ]);
  });

  it('keeps one selection list when the catalog arrives and when the user changes it', () => {
    const stubs = comboStubsFromOptions(saved);
    const catalog: MealComboResponse[] = [
      { ...stubs[0], name: 'Chicken Thali', price: 90, items: [{ itemId: 'a', name: 'Rice' }] },
      { ...stubs[1], name: 'Dal Rice Combo' },
    ];
    const stillSelected = ['c1', 'c2', 'c4', 'c5'];
    const merged = mergeCatalogRecords(stubs, catalog, stillSelected, combo => combo.comboId);
    expect(merged.map(combo => combo.comboId)).toEqual(['c1', 'c2', 'c4']);
    expect(merged.find(combo => combo.comboId === 'c1')?.price).toBe(90);
    expect(merged.find(combo => combo.comboId === 'c3')).toBeUndefined();
    expect(selectionSummaryCount(stillSelected, ['i9'], 0)).toBe(5);
  });

  it('does not treat extras as main selections', () => {
    const stubs = itemStubsFromOptions([
      itemOption('i1', 'Plain Rice'),
      { ...itemOption('i2', 'Curd'), isExtra: true },
    ]);
    expect(stubs.map(item => item.itemId)).toEqual(['i1']);
  });
});
