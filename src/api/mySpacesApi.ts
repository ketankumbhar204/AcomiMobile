import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import {
  ApiError,
  ApiResponse,
  DefaultSpaceResponse,
  MySpaceResponse,
  SetDefaultSpaceResponse,
  UUID,
} from './types';
import { devLog } from '../utils/devLog';

const LOG_TAG = '[MySpacesApi]';

/** Jackson can emit boolean isDefault as "default". Keep the client field stable. */
function withDefaultFlag(space: MySpaceResponse): MySpaceResponse {
  const raw = space as MySpaceResponse & { default?: boolean };
  return {
    ...space,
    isDefault: Boolean(raw.isDefault || raw.default),
  };
}

export const mySpacesApi = {
  getMySpaces: async (): Promise<MySpaceResponse[]> => {
    devLog(`${LOG_TAG} GET /spaces/my`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MySpaceResponse[]>>('/spaces/my'),
    );

    devLog(`${LOG_TAG} getMySpaces response`, response.length);
    return response.map(withDefaultFlag);
  },

  searchMySpaces: async (query: string): Promise<MySpaceResponse[]> => {
    const trimmed = query.trim();
    devLog(`${LOG_TAG} GET /spaces/my?search=`, trimmed);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MySpaceResponse[]>>('/spaces/my', {
        params: { search: trimmed },
      }),
    );

    devLog(`${LOG_TAG} searchMySpaces response`, response.length);
    return response.map(withDefaultFlag);
  },

  getDefaultSpace: async (): Promise<DefaultSpaceResponse | null> => {
    devLog(`${LOG_TAG} GET /spaces/default`);

    try {
      const response = await unwrapApiResponse(
        apiClient.get<ApiResponse<DefaultSpaceResponse>>('/spaces/default'),
      );

      devLog(`${LOG_TAG} getDefaultSpace response`, response.spaceId);
      return response;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        devLog(`${LOG_TAG} getDefaultSpace — no default set (404)`);
        return null;
      }

      console.error(`${LOG_TAG} getDefaultSpace failed`, err);
      throw err;
    }
  },

  setDefaultSpace: async (spaceId: UUID): Promise<SetDefaultSpaceResponse> => {
    devLog(`${LOG_TAG} PUT /spaces/${spaceId}/default`);

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<SetDefaultSpaceResponse>>(
        `/spaces/${spaceId}/default`,
      ),
    );

    devLog(`${LOG_TAG} setDefaultSpace response`, response.spaceId);
    return response;
  },

  listMyListings: async (params?: {
    status?: 'LIVE' | 'PENDING';
    kind?: 'PROPERTY' | 'MESS';
    search?: string;
  }): Promise<MeListing[]> => {
    devLog(`${LOG_TAG} GET /me/listings`, params);
    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MeListing[]>>('/me/listings', { params }),
    );
    return Array.isArray(response) ? response : [];
  },

  updatePropertyLead: async (registrationId: string, body: OwnedLeadUpdate): Promise<MeListing> => {
    return unwrapApiResponse(
      apiClient.put<ApiResponse<MeListing>>(
        `/me/listings/property-registrations/${registrationId}`,
        body,
      ),
    );
  },

  updateMessLead: async (registrationId: string, body: OwnedLeadUpdate): Promise<MeListing> => {
    return unwrapApiResponse(
      apiClient.put<ApiResponse<MeListing>>(
        `/me/listings/mess-registrations/${registrationId}`,
        body,
      ),
    );
  },
};

export type MeListing = {
  spaceId?: string | null;
  registrationId?: string | null;
  kind: 'PROPERTY' | 'MESS';
  spaceType?: string | null;
  name: string;
  address?: string | null;
  publication: 'LIVE' | 'PENDING';
  registrationReference?: string | null;
  registrationStatus?: string | null;
  operationalManagementAvailable?: boolean;
  accommodationPath?: string | null;
  mealsPath?: string | null;
  publicPath?: string | null;
};

export type OwnedLeadUpdate = {
  propertyName?: string;
  messName?: string;
  addressLine?: string;
};
