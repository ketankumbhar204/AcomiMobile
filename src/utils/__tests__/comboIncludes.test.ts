import {
  buildItemQuantitiesPayload,
  formatComboIncludeLine,
  formatComboIncludeLines,
  formatComboIncludesCompact,
  normalizeComboItemQuantity,
  syncItemQuantities,
} from '../comboIncludes';

describe('comboIncludes', () => {
  it('defaults missing quantity to 1', () => {
    expect(normalizeComboItemQuantity(undefined)).toBe(1);
    expect(normalizeComboItemQuantity(null)).toBe(1);
    expect(normalizeComboItemQuantity(0)).toBe(1);
    expect(normalizeComboItemQuantity(3)).toBe(3);
  });

  it('formats lines without quantity prefix when qty is 1', () => {
    expect(formatComboIncludeLine('Rice', 1)).toBe('Rice');
    expect(formatComboIncludeLine('Chapati', 3)).toBe('3 Chapati');
  });

  it('builds compact and list formats', () => {
    const items = [
      { name: 'Chapati', quantity: 3 },
      { name: 'Rice', quantity: 1 },
      { name: 'Dal' },
    ];
    expect(formatComboIncludeLines(items)).toEqual(['3 Chapati', 'Rice', 'Dal']);
    expect(formatComboIncludesCompact(items)).toBe('3 Chapati · Rice · Dal');
  });

  it('syncs quantity map to selected ids', () => {
    expect(syncItemQuantities({ a: 2, b: 4 }, ['b', 'c'])).toEqual({ b: 4, c: 1 });
  });

  it('builds API payload', () => {
    expect(buildItemQuantitiesPayload(['a', 'b'], { a: 3 })).toEqual([
      { itemId: 'a', quantity: 3 },
      { itemId: 'b', quantity: 1 },
    ]);
  });
});
