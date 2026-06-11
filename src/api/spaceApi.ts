import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import {
  ApiResponse,
  CreateSpaceRequest,
  SpaceDetailsResponse,
  SpaceResponse,
  UpdateSpaceRequest,
  UserSpaceResponse,
  UUID,
} from './types';

const LOG_TAG = '[SpaceApi]';

export const spaceApi = {
  createSpace: async (payload: CreateSpaceRequest): Promise<SpaceResponse> => {
    console.log(`${LOG_TAG} POST /spaces`, payload);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceResponse>>('/spaces', payload),
    );

    console.log(`${LOG_TAG} createSpace response`, response);
    return response;
  },

  getSpaceById: async (spaceId: UUID): Promise<SpaceDetailsResponse> => {
    console.log(`${LOG_TAG} GET /spaces/${spaceId}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<SpaceDetailsResponse>>(`/spaces/${spaceId}`),
    );

    console.log(`${LOG_TAG} getSpaceById response`, response);
    return response;
  },

  updateSpace: async (
    spaceId: UUID,
    payload: UpdateSpaceRequest,
  ): Promise<SpaceDetailsResponse> => {
    console.log(`${LOG_TAG} PUT /spaces/${spaceId}`, payload);

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<SpaceDetailsResponse>>(
        `/spaces/${spaceId}`,
        payload,
      ),
    );

    console.log(`${LOG_TAG} updateSpace response`, response);
    return response;
  },

  getUserSpaces: async (userId: UUID): Promise<UserSpaceResponse[]> => {
    console.log(`${LOG_TAG} GET /spaces/user/${userId}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<UserSpaceResponse[]>>(
        `/spaces/user/${userId}`,
      ),
    );

    console.log(`${LOG_TAG} getUserSpaces response`, response);
    return response;
  },

  deactivateSpace: async (spaceId: UUID): Promise<void> => {
    console.log(`${LOG_TAG} DELETE /spaces/${spaceId}`);

    const response = await apiClient.delete(`/spaces/${spaceId}`);

    if (response.status === 204) {
      console.log(`${LOG_TAG} deactivateSpace success (204)`);
      return;
    }

    const envelope = response.data as ApiResponse<unknown> | undefined;
    if (envelope && envelope.success === false) {
      throw new Error(envelope.message ?? 'Failed to deactivate space');
    }

    console.log(`${LOG_TAG} deactivateSpace completed`, response.status);
  },

  /** @deprecated Use createSpace */
  create: async (payload: CreateSpaceRequest): Promise<SpaceResponse> =>
    spaceApi.createSpace(payload),
};
