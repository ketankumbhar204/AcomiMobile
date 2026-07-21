import {
  collectSelectionPriceErrors,
  firstPriceErrorTarget,
} from '../menuSelectionPriceValidation';

describe('collectSelectionPriceErrors', () => {
  it('returns no errors when prices are not required', () => {
    expect(
      collectSelectionPriceErrors({
        requiresMealPrices: false,
        selectedCombos: [{ comboId: 'c1', name: 'Thali', isActive: true, price: null }] as never,
        selectedItems: [{ itemId: 'i1', name: 'Poha', defaultPrice: null }] as never,
        adHocPackages: [],
        draftPrices: {},
      }),
    ).toEqual({});
  });

  it('marks empty, invalid, and non-positive drafts', () => {
    const errors = collectSelectionPriceErrors({
      requiresMealPrices: true,
      selectedCombos: [
        { comboId: 'c1', name: 'Thali', isActive: true, price: null },
      ] as never,
      selectedItems: [
        { itemId: 'i1', name: 'Poha', defaultPrice: null },
        { itemId: 'i2', name: 'Tea', defaultPrice: null },
      ] as never,
      adHocPackages: [],
      draftPrices: {
        c1: '',
        i1: 'abc',
        i2: '0',
      },
    });

    expect(errors).toEqual({
      c1: 'required',
      i1: 'invalid',
      i2: 'nonPositive',
    });
  });

  it('accepts valid positive prices', () => {
    const errors = collectSelectionPriceErrors({
      requiresMealPrices: true,
      selectedCombos: [
        { comboId: 'c1', name: 'Thali', isActive: true, price: 80 },
      ] as never,
      selectedItems: [{ itemId: 'i1', name: 'Poha', defaultPrice: 30 }] as never,
      adHocPackages: [{ label: 'Custom', itemIds: ['a', 'b'], price: 100 }],
      draftPrices: {
        c1: '80',
        i1: '30',
        'package:Custom': '100',
      },
    });

    expect(errors).toEqual({});
  });
});

describe('firstPriceErrorTarget', () => {
  it('prefers combo tab when a combo is invalid', () => {
    expect(
      firstPriceErrorTarget({ c1: 'required', i1: 'required' }, ['c1'], ['i1']),
    ).toEqual({ id: 'c1', tab: 'combos' });
  });

  it('falls back when only extras are invalid (extras handled outside panel)', () => {
    expect(
      firstPriceErrorTarget({ 'extra:i1': 'required' }, [], [], ['i1']),
    ).toEqual({
      id: 'extra:i1',
      tab: 'combos',
    });
  });
});
