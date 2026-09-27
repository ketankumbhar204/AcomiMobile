import type { DiscoverSpacesParams } from './types';

export const DISCOVER_PAGE_SIZE = 20;

export function buildDiscoverSearchParams(
  params: DiscoverSpacesParams = {},
): URLSearchParams {
  const query = new URLSearchParams();
  const search = params.search?.trim();
  const location = params.location?.trim();
  if (search) {
    query.set('search', search);
  }
  if (location) {
    query.set('location', location);
  }
  if (params.type) {
    query.set('type', params.type);
  }
  for (const type of params.types ?? []) {
    if (type) {
      query.append('types', type);
    }
  }
  if (params.minRent != null) {
    query.set('minRent', String(params.minRent));
  }
  if (params.maxRent != null) {
    query.set('maxRent', String(params.maxRent));
  }
  for (const code of params.amenities ?? []) {
    const trimmed = code.trim();
    if (trimmed) {
      query.append('amenities', trimmed);
    }
  }
  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? DISCOVER_PAGE_SIZE));
  query.set('sort', params.sort ?? 'newest');
  return query;
}

export function discoverFilterKey(params: DiscoverSpacesParams): string {
  return JSON.stringify({
    search: params.search?.trim() ?? '',
    location: params.location?.trim() ?? '',
    type: params.type ?? '',
    types: [...(params.types ?? [])].sort(),
    minRent: params.minRent ?? null,
    maxRent: params.maxRent ?? null,
    amenities: [...(params.amenities ?? [])].map(code => code.trim()).filter(Boolean).sort(),
    sort: params.sort ?? 'newest',
  });
}
