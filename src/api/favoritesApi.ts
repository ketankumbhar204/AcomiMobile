import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type { ApiResponse, DiscoverSpaceCardResponse, UUID } from './types';

export type FavoriteStateResponse = {
  spaceId: UUID;
  favorited: boolean;
};

export const favoritesApi = {
  list: async (): Promise<DiscoverSpaceCardResponse[]> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<DiscoverSpaceCardResponse[]>>('/me/favorites'),
    );
  },

  ids: async (): Promise<UUID[]> => {
    return unwrapApiResponse(apiClient.get<ApiResponse<UUID[]>>('/me/favorites/ids'));
  },

  add: async (spaceId: UUID): Promise<FavoriteStateResponse> => {
    return unwrapApiResponse(
      apiClient.put<ApiResponse<FavoriteStateResponse>>(`/me/favorites/${spaceId}`),
    );
  },

  remove: async (spaceId: UUID): Promise<FavoriteStateResponse> => {
    return unwrapApiResponse(
      apiClient.delete<ApiResponse<FavoriteStateResponse>>(`/me/favorites/${spaceId}`),
    );
  },
};
