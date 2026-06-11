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

const LOG_TAG = '[MySpacesApi]';

export const mySpacesApi = {
  getMySpaces: async (): Promise<MySpaceResponse[]> => {
    console.log(`${LOG_TAG} GET /spaces/my`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MySpaceResponse[]>>('/spaces/my'),
    );

    console.log(`${LOG_TAG} getMySpaces response`, response.length);
    return response;
  },

  searchMySpaces: async (query: string): Promise<MySpaceResponse[]> => {
    const trimmed = query.trim();
    console.log(`${LOG_TAG} GET /spaces/my?search=`, trimmed);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MySpaceResponse[]>>('/spaces/my', {
        params: { search: trimmed },
      }),
    );

    console.log(`${LOG_TAG} searchMySpaces response`, response.length);
    return response;
  },

  getDefaultSpace: async (): Promise<DefaultSpaceResponse | null> => {
    console.log(`${LOG_TAG} GET /spaces/default`);

    try {
      const response = await unwrapApiResponse(
        apiClient.get<ApiResponse<DefaultSpaceResponse>>('/spaces/default'),
      );

      console.log(`${LOG_TAG} getDefaultSpace response`, response.spaceId);
      return response;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        console.log(`${LOG_TAG} getDefaultSpace — no default set (404)`);
        return null;
      }

      console.error(`${LOG_TAG} getDefaultSpace failed`, err);
      throw err;
    }
  },

  setDefaultSpace: async (spaceId: UUID): Promise<SetDefaultSpaceResponse> => {
    console.log(`${LOG_TAG} PUT /spaces/${spaceId}/default`);

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<SetDefaultSpaceResponse>>(
        `/spaces/${spaceId}/default`,
      ),
    );

    console.log(`${LOG_TAG} setDefaultSpace response`, response.spaceId);
    return response;
  },
};
