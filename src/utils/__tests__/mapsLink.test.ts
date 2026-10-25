import { openableMapsUrl } from '../mapsLink';

describe('openableMapsUrl', () => {
  it('rewrites a place id query into a Maps place link', () => {
    expect(
      openableMapsUrl('https://www.google.com/maps/place/?q=place_id:ChIJM4wUk9i7wjsRVI123'),
    ).toBe(
      'https://www.google.com/maps/search/?api=1&query=ChIJM4wUk9i7wjsRVI123&query_place_id=ChIJM4wUk9i7wjsRVI123',
    );
  });

  it('leaves coordinate and existing place links unchanged', () => {
    const coords = 'https://www.google.com/maps/search/?api=1&query=18.56,73.77';
    const place = 'https://www.google.com/maps/search/?api=1&query=FloColive&query_place_id=ChIJM4wUk9i7wjsRVI123';
    expect(openableMapsUrl(coords)).toBe(coords);
    expect(openableMapsUrl(place)).toBe(place);
  });
});
