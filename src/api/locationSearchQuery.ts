export const LOCATION_SEARCH_LIMIT = 20;

export type LocationSearchQuery = {
  q: string;
  limit?: number;
  state?: string | null;
  district?: string | null;
  taluk?: string | null;
};

/**
 * Builds GET /locations/search params.
 * `q` is sent whole — the backend tokenizes spaces/commas (AND match).
 * state/district/taluk are ranking boosts only and never filter results.
 */
export function buildLocationSearchParams(input: LocationSearchQuery): Record<string, string | number> {
  const q = input.q.trim();
  const params: Record<string, string | number> = {
    q,
    limit: input.limit ?? LOCATION_SEARCH_LIMIT,
  };
  const state = input.state?.trim();
  const district = input.district?.trim();
  const taluk = input.taluk?.trim();
  if (state) {
    params.state = state;
  }
  if (district) {
    params.district = district;
  }
  if (taluk) {
    params.taluk = taluk;
  }
  return params;
}
