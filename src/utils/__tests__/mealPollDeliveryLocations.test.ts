import { resolvePreferredDeliveryLocationId } from '../mealPollDeliveryLocations';
import type { MealDeliveryLocation } from '../../api/types';

const locations: MealDeliveryLocation[] = [
  { id: 'a', name: 'Company A', active: true, sortOrder: 0 },
  { id: 'b', name: 'Company B', active: true, sortOrder: 1 },
];

describe('resolvePreferredDeliveryLocationId', () => {
  it('uses last selected when still active', () => {
    expect(resolvePreferredDeliveryLocationId(locations, 'b')).toBe('b');
  });

  it('falls back to first active when last is missing', () => {
    expect(resolvePreferredDeliveryLocationId(locations, null)).toBe('a');
  });

  it('falls back to first active when last is inactive/unknown', () => {
    expect(resolvePreferredDeliveryLocationId(locations, 'gone')).toBe('a');
  });

  it('returns undefined when catalog is empty', () => {
    expect(resolvePreferredDeliveryLocationId([], 'a')).toBeUndefined();
  });
});
