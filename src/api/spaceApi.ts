import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import {
  ApiResponse,
  CreateSpaceRequest,
  SpaceResponse,
  UserSpaceResponse,
  UUID,
} from './types';

export const spaceApi = {
  create: async (payload: CreateSpaceRequest): Promise<SpaceResponse> => {
    console.log('[SpaceAPI] POST /spaces');
    console.log('[SpaceAPI] Payload', payload);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceResponse>>('/spaces', payload),
    );

    console.log('[SpaceAPI] Response', response);

    return response;
  },

  getUserSpaces: async (
    userId: UUID,
  ): Promise<UserSpaceResponse[]> => {
    console.log(`[SpaceAPI] GET /spaces/user/${userId}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<UserSpaceResponse[]>>(
        `/spaces/user/${userId}`,
      ),
    );

    console.log('[SpaceAPI] Response', response);

    return response;
  },
};