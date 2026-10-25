import {
  bedStatusForPropertyOpsFocus,
  filterBedsById,
  propertyOpsFocusFromInventory,
} from '../propertyOpsFocus';

describe('propertyOpsFocus', () => {
  it('maps the open inventory screen to the highlighted card', () => {
    expect(propertyOpsFocusFromInventory('AVAILABLE')).toBe('vacant');
    expect(propertyOpsFocusFromInventory('OCCUPIED')).toBe('occupied');
    expect(propertyOpsFocusFromInventory('OCCUPIED', 'moveIns')).toBe('moveIns');
    expect(propertyOpsFocusFromInventory('RESERVED')).toBeNull();
  });

  it('loads occupied beds for move-ins and vacant beds for the vacant card', () => {
    expect(bedStatusForPropertyOpsFocus('vacant')).toBe('AVAILABLE');
    expect(bedStatusForPropertyOpsFocus('occupied')).toBe('OCCUPIED');
    expect(bedStatusForPropertyOpsFocus('moveIns')).toBe('OCCUPIED');
  });

  it('keeps only beds that moved in this month', () => {
    const beds = [{ bedId: 'a' }, { bedId: 'b' }, { bedId: 'c' }];
    expect(filterBedsById(beds, new Set(['b', 'c']))).toEqual([{ bedId: 'b' }, { bedId: 'c' }]);
    expect(filterBedsById(beds, null)).toEqual(beds);
  });
});
