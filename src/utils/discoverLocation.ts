import type { LocationRecord } from '../api/types';

export type SelectedDiscoverLocation = {
  location: string;
  district: string;
  state: string;
  cityTaluka: string;
  pincode: string;
};

function titleCaseState(state: string): string {
  return state
    .toLowerCase()
    .replace(/\b([a-z])/g, letter => letter.toUpperCase());
}

export function toSelectedDiscoverLocation(
  record: LocationRecord,
): SelectedDiscoverLocation {
  return {
    location: record.location?.trim() ?? '',
    district: record.district?.trim() ?? '',
    state: record.state?.trim() ?? '',
    cityTaluka: record.cityTaluka?.trim() ?? '',
    pincode: record.pincode?.trim() ?? '',
  };
}

export function formatDiscoverLocationLabel(
  selected: SelectedDiscoverLocation,
): string {
  const location = selected.location.trim();
  const district = selected.district.trim();
  const state = selected.state.trim();
  if (location && district && location.toLowerCase() !== district.toLowerCase()) {
    return `${location}, ${district}`;
  }
  if (location && district && state) {
    return `${location} · ${district} · ${titleCaseState(state)}`;
  }
  if (location && state && location.toLowerCase() !== state.toLowerCase()) {
    return `${location} · ${titleCaseState(state)}`;
  }
  return location;
}

export function matchLocationRecord(
  results: LocationRecord[],
  selected: Pick<SelectedDiscoverLocation, 'location' | 'pincode'>,
): LocationRecord | undefined {
  const location = selected.location.trim().toLowerCase();
  const pincode = selected.pincode.trim();
  return (
    results.find(
      record =>
        record.location.toLowerCase() === location &&
        (!pincode || record.pincode === pincode),
    ) ?? results.find(record => Boolean(pincode) && record.pincode === pincode)
  );
}

export function formatDiscoverLocationContext(record: LocationRecord): string {
  const district = record.district?.trim() ?? '';
  const state = record.state?.trim() ?? '';
  if (district && state) {
    return `${district} · ${titleCaseState(state)}`;
  }
  return district || titleCaseState(state);
}

export function locationRecordKey(record: LocationRecord): string {
  return [record.location, record.pincode, record.cityTaluka, record.district].join('|');
}

/** Prompt once per Places/Mess tab when the page opens without a location. */
export function shouldPromptDiscoverLocation(input: {
  routeReady: boolean;
  hasLocation: boolean;
  category: string;
  promptedFor: string | null;
}): boolean {
  if (!input.routeReady || input.hasLocation) {
    return false;
  }
  return input.promptedFor !== input.category;
}
