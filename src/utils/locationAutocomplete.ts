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

export function googleMapsLink(latitude: number, longitude: number): string {
  const format = (value: number) => String(Math.round(value * 10_000_000) / 10_000_000);
  return `https://www.google.com/maps?q=${format(latitude)},${format(longitude)}`;
}

export type AddressCapture = {
  buildingName: string;
  query: string;
  selected: boolean;
  address: string;
  locality: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  mapUrl: string;
};

export const EMPTY_ADDRESS_CAPTURE: AddressCapture = {
  buildingName: '',
  query: '',
  selected: false,
  address: '',
  locality: '',
  city: '',
  district: '',
  state: '',
  pincode: '',
  latitude: null,
  longitude: null,
  mapUrl: '',
};

function finiteCoordinate(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function composeStoredAddress(
  value: Pick<AddressCapture, 'buildingName' | 'address'>,
  maxLength = 255,
): string {
  const building = value.buildingName.trim();
  const line = value.address.trim();
  if (!building) return line.slice(0, maxLength);
  if (!line) return building.slice(0, maxLength);
  if (line.toLowerCase().startsWith(building.toLowerCase())) return line.slice(0, maxLength);
  return `${building}, ${line}`.slice(0, maxLength);
}

export function captureFromSuggestion(
  current: AddressCapture,
  suggestion: LocationAutocompleteSuggestion,
): AddressCapture | null {
  const latitude = finiteCoordinate(suggestion.latitude);
  const longitude = finiteCoordinate(suggestion.longitude);
  const city = clean(suggestion.city);
  const state = clean(suggestion.state);
  if (latitude == null || longitude == null || !city || !state) return null;
  const locality = clean(suggestion.area);
  const formatted = clean(suggestion.formattedAddress) || clean(suggestion.displayName);
  const address = (formatted || [locality, city, state].filter(Boolean).join(', ')).slice(0, 255);
  return {
    ...current,
    query: formatted || address,
    selected: true,
    address,
    locality,
    city,
    district: clean(suggestion.district),
    state,
    pincode: clean(suggestion.pincode),
    latitude,
    longitude,
    mapUrl: googleMapsLink(latitude, longitude),
  };
}

export function captureFromParts(parts: {
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  mapUrl?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  buildingName?: string | null;
}): AddressCapture {
  const address = clean(parts.addressLine);
  const latitude = finiteCoordinate(parts.latitude);
  const longitude = finiteCoordinate(parts.longitude);
  return {
    buildingName: clean(parts.buildingName),
    query: address,
    selected: Boolean(address && clean(parts.city) && clean(parts.state)),
    address,
    locality: '',
    city: clean(parts.city),
    district: '',
    state: clean(parts.state),
    pincode: clean(parts.pincode),
    latitude,
    longitude,
    mapUrl:
      clean(parts.mapUrl) ||
      (latitude != null && longitude != null ? googleMapsLink(latitude, longitude) : ''),
  };
}

export function captureFromFreeText(address: string | null | undefined): AddressCapture {
  const line = clean(address);
  return { ...EMPTY_ADDRESS_CAPTURE, query: line, address: line, selected: Boolean(line) };
}

export function withAddressQuery(current: AddressCapture, query: string): AddressCapture {
  if (!current.selected) return { ...current, query };
  return { ...EMPTY_ADDRESS_CAPTURE, buildingName: current.buildingName, query };
}

export type AddressCaptureIssue = 'building' | 'selection' | 'pincode' | null;

export function addressCaptureIssue(
  value: AddressCapture,
  options: { required?: boolean; requireBuilding?: boolean; pincodeRequired?: boolean; allowManual?: boolean } = {},
): AddressCaptureIssue {
  const started = Boolean(value.query.trim() || value.buildingName.trim() || value.selected);
  if (options.requireBuilding && !value.buildingName.trim() && (options.required || value.selected)) {
    return 'building';
  }
  if (
    !options.allowManual &&
    !value.selected &&
    (options.required || (started && value.query.trim() && value.query.trim() !== value.address.trim()))
  ) {
    return 'selection';
  }
  if (value.selected && options.pincodeRequired && !/^[1-9]\d{5}$/.test(value.pincode.trim())) {
    return 'pincode';
  }
  if (value.pincode.trim() && !/^[1-9]\d{5}$/.test(value.pincode.trim())) {
    return 'pincode';
  }
  return null;
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
