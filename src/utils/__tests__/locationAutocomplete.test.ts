import {
  suggestionDetail,
  suggestionToLocationRecord,
  type LocationAutocompleteSuggestion,
} from '../locationAutocomplete';

describe('location autocomplete mapping', () => {
  const hinjewadi: LocationAutocompleteSuggestion = {
    displayName: 'Hinjawadi',
    area: 'Hinjawadi',
    taluka: 'Mulshi',
    district: 'Pune District',
    state: 'Maharashtra',
    pincode: '411057',
    matched: false,
  };

  it('keeps an unmatched suggestion without inventing fields', () => {
    expect(suggestionToLocationRecord(hinjewadi)).toEqual({
      location: 'Hinjawadi',
      cityTaluka: 'Mulshi',
      district: 'Pune District',
      state: 'Maharashtra',
      pincode: '411057',
    });
    expect(suggestionDetail(hinjewadi)).toBe('Mulshi, Pune District, Maharashtra');
  });

  it('uses the matched ACOMI row and does not merge a different pincode', () => {
    const suggestion: LocationAutocompleteSuggestion = {
      ...hinjewadi,
      pincode: '411001',
      matched: true,
      acomiLocation: {
        location: 'Aundh',
        cityTaluka: 'Haveli',
        district: 'Pune',
        state: 'MAHARASHTRA',
        pincode: '411007',
      },
    };
    expect(suggestionToLocationRecord(suggestion)?.pincode).toBe('411007');
    expect(suggestionToLocationRecord({ displayName: '   ' })).toBeNull();
  });
});
