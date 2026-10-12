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
  appendList(query, 'amenities', params.amenities);
  appendList(query, 'genders', params.genders);
  appendList(query, 'sharings', params.sharings);
  appendList(query, 'foods', params.foods);
  appendList(query, 'furnishings', params.furnishings);
  if (params.contactAvailable) {
    query.set('contactAvailable', 'true');
  }
  appendList(query, 'mealTypes', params.mealTypes);
  appendList(query, 'foodTypes', params.foodTypes);
  if (params.servicedApartment) {
    query.set('servicedApartment', 'true');
  }
  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? DISCOVER_PAGE_SIZE));
  query.set('sort', params.sort ?? 'newest');
  return query;
}

function appendList(query: URLSearchParams, key: string, values?: string[]) {
  for (const value of values ?? []) {
    const trimmed = value.trim();
    if (trimmed) {
      query.append(key, trimmed);
    }
  }
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
    genders: [...(params.genders ?? [])].map(value => value.trim()).filter(Boolean).sort(),
    sharings: [...(params.sharings ?? [])].map(value => value.trim()).filter(Boolean).sort(),
    foods: [...(params.foods ?? [])].map(value => value.trim()).filter(Boolean).sort(),
    furnishings: [...(params.furnishings ?? [])].map(value => value.trim()).filter(Boolean).sort(),
    contactAvailable: params.contactAvailable === true,
    servicedApartment: params.servicedApartment === true,
    mealTypes: [...(params.mealTypes ?? [])].map(value => value.trim()).filter(Boolean).sort(),
    foodTypes: [...(params.foodTypes ?? [])].map(value => value.trim()).filter(Boolean).sort(),
    sort: params.sort ?? 'newest',
  });
}
