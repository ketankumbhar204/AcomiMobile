import { servingLocationMode, usesPropertyServingLocation } from '../servingLocationPolicy';

describe('servingLocationPolicy', () => {
  it('uses delivery locations for mess', () => {
    expect(servingLocationMode('MESS')).toBe('delivery');
  });

  it('uses property serving location for accommodation spaces', () => {
    expect(servingLocationMode('PG')).toBe('property');
    expect(servingLocationMode('HOSTEL')).toBe('property');
    expect(servingLocationMode('CO_LIVING')).toBe('property');
    expect(usesPropertyServingLocation('property')).toBe(true);
  });

  it('hides serving location for rental', () => {
    expect(servingLocationMode('RENTAL')).toBe('hidden');
  });
});
