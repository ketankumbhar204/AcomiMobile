import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import {
  LOCATION_SEARCH_LIMIT,
  buildLocationSearchParams,
  type LocationSearchQuery,
} from './locationSearchQuery';
import type { LocationAutocompleteSuggestion } from '../utils/locationAutocomplete';
import type { ApiResponse, LocationRecord } from './types';
import { devLog } from '../utils/devLog';

const LOG_TAG = '[LocationsApi]';

export const locationsApi = {
  listStates: async (): Promise<string[]> => {
    devLog(`${LOG_TAG} GET /locations/states`);
    return unwrapApiResponse(apiClient.get<ApiResponse<string[]>>('/locations/states'));
  },

  listDistricts: async (state: string): Promise<string[]> => {
    devLog(`${LOG_TAG} GET /locations/districts`, { state });
    return unwrapApiResponse(
      apiClient.get<ApiResponse<string[]>>('/locations/districts', {
        params: { state },
      }),
    );
  },

  listTalukas: async (state: string, district: string): Promise<string[]> => {
    devLog(`${LOG_TAG} GET /locations/talukas`, { state, district });
    return unwrapApiResponse(
      apiClient.get<ApiResponse<string[]>>('/locations/talukas', {
        params: { state, district },
      }),
    );
  },

  listAreas: async (
    state: string,
    district: string,
    taluk: string,
  ): Promise<LocationRecord[]> => {
    devLog(`${LOG_TAG} GET /locations/areas`, { state, district, taluk });
    return unwrapApiResponse(
      apiClient.get<ApiResponse<LocationRecord[]>>('/locations/areas', {
        params: { state, district, taluk },
      }),
    );
  },

  search: async (
    q: string,
    options: Omit<LocationSearchQuery, 'q'> = {},
  ): Promise<LocationRecord[]> => {
    const params = buildLocationSearchParams({
      q,
      limit: options.limit ?? LOCATION_SEARCH_LIMIT,
      state: options.state,
      district: options.district,
      taluk: options.taluk,
    });
    devLog(`${LOG_TAG} GET /locations/search`, params);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<LocationRecord[]>>('/locations/search', {
        params,
      }),
    );
  },

  autocomplete: async (
    q: string,
    options: Pick<LocationSearchQuery, 'state' | 'district'> = {},
  ): Promise<LocationAutocompleteSuggestion[]> => {
    const params: Record<string, string> = { q: q.trim() };
    const state = options.state?.trim();
    const district = options.district?.trim();
    if (state) {
      params.state = state;
    }
    if (district) {
      params.district = district;
    }
    devLog(`${LOG_TAG} GET /locations/autocomplete`, { queryLength: q.trim().length });
    return unwrapApiResponse(
      apiClient.get<ApiResponse<LocationAutocompleteSuggestion[]>>('/locations/autocomplete', {
        params,
      }),
    );
  },
};
