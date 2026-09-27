import { DISCOVER_PAGE_SIZE, buildDiscoverSearchParams, discoverFilterKey } from '../discoverQuery';

describe('buildDiscoverSearchParams', () => {
  it('sends location separately from search and pages at size 20', () => {
    const query = buildDiscoverSearchParams({
      location: 'Aundh',
      search: 'Girls',
      type: 'PG',
      minRent: 5000,
      maxRent: 15000,
      amenities: ['WIFI', 'FOOD_INCLUDED'],
      page: 0,
    });

    expect(query.get('location')).toBe('Aundh');
    expect(query.get('search')).toBe('Girls');
    expect(query.get('type')).toBe('PG');
    expect(query.get('minRent')).toBe('5000');
    expect(query.get('maxRent')).toBe('15000');
    expect(query.getAll('amenities')).toEqual(['WIFI', 'FOOD_INCLUDED']);
    expect(query.get('page')).toBe('0');
    expect(query.get('size')).toBe(String(DISCOVER_PAGE_SIZE));
    expect(query.has('pincode')).toBe(false);
  });

  it('sends the Places type list separately from location', () => {
    const query = buildDiscoverSearchParams({
      location: 'Aundh',
      types: ['PG', 'HOSTEL', 'CO_LIVING', 'RENTAL'],
      page: 0,
    });
    expect(query.get('location')).toBe('Aundh');
    expect(query.getAll('types')).toEqual(['PG', 'HOSTEL', 'CO_LIVING', 'RENTAL']);
    expect(query.has('type')).toBe(false);
    expect(query.has('pincode')).toBe(false);
  });

  it('does not invent a locations.json path', () => {
    const serialized = buildDiscoverSearchParams({ location: 'Balewadi' }).toString();
    expect(serialized).not.toContain('locations.json');
    expect(serialized).not.toContain('reference/locations');
  });
});

describe('discoverFilterKey', () => {
  it('changes when location or filters change so pagination can reset', () => {
    const aundh = discoverFilterKey({ location: 'Aundh', search: 'PG' });
    const balewadi = discoverFilterKey({ location: 'Balewadi', search: 'PG' });
    const extraFilter = discoverFilterKey({ location: 'Aundh', search: 'PG', minRent: 5000 });
    expect(aundh).not.toBe(balewadi);
    expect(aundh).not.toBe(extraFilter);
  });

  it('keeps mess location separate from search and type=MESS', () => {
    const key = discoverFilterKey({ location: 'Hinjewadi', search: 'tiffin', type: 'MESS' });
    const params = buildDiscoverSearchParams({
      location: 'Hinjewadi',
      search: 'tiffin',
      type: 'MESS',
      page: 0,
    });
    expect(params.get('location')).toBe('Hinjewadi');
    expect(params.get('search')).toBe('tiffin');
    expect(params.get('type')).toBe('MESS');
    expect(params.get('size')).toBe(String(DISCOVER_PAGE_SIZE));
    expect(params.has('minRent')).toBe(false);
    expect(key).not.toBe(discoverFilterKey({ location: 'Aundh', search: 'tiffin', type: 'MESS' }));
  });
});
