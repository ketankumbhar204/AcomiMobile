import {
  formatDiscoverLocationLabel,
  matchLocationRecord,
  shouldPromptDiscoverLocation,
  toSelectedDiscoverLocation,
} from '../discoverLocation';

describe('discover location helpers', () => {
  it('keeps city/taluka and pincode without inventing a city field', () => {
    const selected = toSelectedDiscoverLocation({
      location: 'Aundh',
      district: 'Pune',
      state: 'MAHARASHTRA',
      cityTaluka: 'Pune City',
      pincode: '411007',
    });
    expect(selected).toEqual({
      location: 'Aundh',
      district: 'Pune',
      state: 'MAHARASHTRA',
      cityTaluka: 'Pune City',
      pincode: '411007',
    });
    expect(formatDiscoverLocationLabel(selected)).toBe('Aundh, Pune');
  });

  it('matches a search result by location and pincode', () => {
    const match = matchLocationRecord(
      [
        {
          location: 'Aundh',
          district: 'Kangra',
          state: 'HIMACHAL PRADESH',
          cityTaluka: 'Aundh',
          pincode: '176401',
        },
        {
          location: 'Aundh',
          district: 'Pune',
          state: 'MAHARASHTRA',
          cityTaluka: 'Haveli',
          pincode: '411007',
        },
      ],
      { location: 'Aundh', pincode: '411007' },
    );
    expect(match?.district).toBe('Pune');
    expect(match?.pincode).toBe('411007');
  });

  it('prompts for location when Places or Mess opens without one', () => {
    expect(
      shouldPromptDiscoverLocation({
        routeReady: true,
        hasLocation: false,
        category: 'places',
        promptedFor: null,
      }),
    ).toBe(true);
    expect(
      shouldPromptDiscoverLocation({
        routeReady: true,
        hasLocation: true,
        category: 'places',
        promptedFor: null,
      }),
    ).toBe(false);
    expect(
      shouldPromptDiscoverLocation({
        routeReady: true,
        hasLocation: false,
        category: 'mess',
        promptedFor: 'places',
      }),
    ).toBe(true);
    expect(
      shouldPromptDiscoverLocation({
        routeReady: false,
        hasLocation: false,
        category: 'places',
        promptedFor: null,
      }),
    ).toBe(false);
  });
});
