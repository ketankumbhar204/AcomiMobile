import type { LocationRecord } from '../api/types';

export const AUTOCOMPLETE_MIN_LENGTH = 3;
export const AUTOCOMPLETE_DEBOUNCE_MS = 350;

export type LocationAutocompleteSuggestion = {
  id?: string | null;
  displayName?: string | null;
  formattedAddress?: string | null;
  name?: string | null;
  area?: string | null;
  city?: string | null;
  taluka?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  country?: string | null;
  source?: string | null;
  matched?: boolean | null;
  acomiLocation?: LocationRecord | null;
};

function clean(value: string | null | undefined): string {
  const text = value?.trim() ?? '';
  if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') {
    return '';
  }
  return text;
}

export function suggestionToLocationRecord(
  suggestion: LocationAutocompleteSuggestion,
): LocationRecord | null {
  const matched = suggestion.acomiLocation;
  if (matched && clean(matched.location)) {
    return {
      location: clean(matched.location),
      district: clean(matched.district),
      state: clean(matched.state),
      cityTaluka: clean(matched.cityTaluka),
      pincode: clean(matched.pincode),
    };
  }
  const location =
    clean(suggestion.area) ||
    clean(suggestion.name) ||
    clean(suggestion.displayName) ||
    clean(suggestion.pincode);
  if (!location) {
    return null;
  }
  return {
    location,
    cityTaluka: clean(suggestion.taluka) || clean(suggestion.city),
    district: clean(suggestion.district),
    state: clean(suggestion.state),
    pincode: clean(suggestion.pincode),
  };
}

export function suggestionTitle(suggestion: LocationAutocompleteSuggestion): string {
  return (
    clean(suggestion.displayName) ||
    clean(suggestion.name) ||
    clean(suggestion.area) ||
    clean(suggestion.formattedAddress) ||
    clean(suggestion.pincode)
  );
}

export function suggestionDetail(suggestion: LocationAutocompleteSuggestion): string {
  const title = suggestionTitle(suggestion).toLowerCase();
  const parts = [
    suggestion.area,
    suggestion.taluka || suggestion.city,
    suggestion.district,
    suggestion.state,
  ]
    .map(clean)
    .filter(Boolean);
  const unique: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (key === title || unique.some(item => item.toLowerCase() === key)) {
      continue;
    }
    unique.push(part);
  }
  return unique.join(', ');
}

export function suggestionKey(
  suggestion: LocationAutocompleteSuggestion,
  index: number,
): string {
  return [
    suggestion.id,
    suggestionTitle(suggestion),
    suggestion.pincode,
    suggestion.district,
    index,
  ]
    .map(value => (typeof value === 'number' ? String(value) : clean(value)))
    .filter(Boolean)
    .join('|');
}
