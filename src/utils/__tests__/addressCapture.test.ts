import {
  addressCaptureIssue,
  captureFromSuggestion,
  composeStoredAddress,
  keepTypedAddress,
  withAddressQuery,
  EMPTY_ADDRESS_CAPTURE,
  type LocationAutocompleteSuggestion,
} from '../locationAutocomplete';

const suggestion: LocationAutocompleteSuggestion = {
  id: 'place-1',
  formattedAddress: 'Baner Road, Baner, Pune, Maharashtra 411045, India',
  area: 'Baner',
  city: 'Pune',
  district: 'Pune',
  state: 'Maharashtra',
  pincode: '411045',
  latitude: 18.5604693,
  longitude: 73.7765629,
  country: 'India',
};

describe('address capture', () => {
  it('keeps the typed building name and stores numeric coordinates', () => {
    const current = { ...EMPTY_ADDRESS_CAPTURE, buildingName: 'Sunrise Residency', query: 'Baner Pune' };
    const captured = captureFromSuggestion(current, suggestion);

    expect(captured).not.toBeNull();
    expect(captured?.buildingName).toBe('Sunrise Residency');
    expect(captured?.city).toBe('Pune');
    expect(captured?.state).toBe('Maharashtra');
    expect(captured?.pincode).toBe('411045');
    expect(captured?.latitude).toBe(18.5604693);
    expect(captured?.longitude).toBe(73.7765629);
    expect(captured?.mapUrl).toBe('https://www.google.com/maps?q=18.5604693,73.7765629');
    expect(composeStoredAddress(captured!)).toBe(
      'Sunrise Residency, Baner Road, Baner, Pune, Maharashtra 411045, India',
    );
  });

  it('drops a suggestion without coordinates', () => {
    expect(captureFromSuggestion(EMPTY_ADDRESS_CAPTURE, { ...suggestion, latitude: null })).toBeNull();
  });

  it('clears the previous coordinates when the search text changes', () => {
    const selected = captureFromSuggestion(
      { ...EMPTY_ADDRESS_CAPTURE, buildingName: 'Sunrise Residency' },
      suggestion,
    )!;
    const next = withAddressQuery(selected, 'Wakad Pune');

    expect(next.selected).toBe(false);
    expect(next.latitude).toBeNull();
    expect(next.longitude).toBeNull();
    expect(next.city).toBe('');
    expect(next.buildingName).toBe('Sunrise Residency');
    expect(addressCaptureIssue(next, { required: true })).toBe('selection');
    expect(addressCaptureIssue(next, { required: true, allowManual: true })).toBeNull();
  });

  it('stores a typed address when autocomplete has no match', () => {
    const typed = keepTypedAddress({
      ...EMPTY_ADDRESS_CAPTURE,
      buildingName: 'Test corporate stay',
      query: 'Mukai Nagar Hinjawadi',
      locality: 'Hinjawadi',
      city: 'Pune',
      state: 'Maharashtra',
    });

    expect(typed.selected).toBe(false);
    expect(typed.latitude).toBeNull();
    expect(addressCaptureIssue(typed, { allowManual: true })).toBeNull();
    expect(composeStoredAddress(typed)).toBe(
      'Test corporate stay, Mukai Nagar Hinjawadi, Pune, Maharashtra',
    );
  });
});
