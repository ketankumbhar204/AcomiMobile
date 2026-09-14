import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type {
  ApiResponse,
  DiscoverSpaceCardResponse,
  DiscoverSpaceDetailResponse,
  DiscoverSpacesParams,
  PagedResponse,
  UUID,
} from './types';
import { devLog } from '../utils/devLog';

const LOG_TAG = '[SpaceDiscoverApi]';

export const spaceDiscoverApi = {
  discoverSpaces: async (
    params: DiscoverSpacesParams = {},
  ): Promise<PagedResponse<DiscoverSpaceCardResponse>> => {
    const { search, type, page = 0, size = 20, sort = 'newest' } = params;
    const trimmedSearch = search?.trim();

    devLog(`${LOG_TAG} GET /spaces/discover`, {
      search: trimmedSearch,
      type,
      page,
      size,
      sort,
    });

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<DiscoverSpaceCardResponse>>>(
        '/spaces/discover',
        {
          params: {
            ...(trimmedSearch ? { search: trimmedSearch } : {}),
            ...(type ? { type } : {}),
            page,
            size,
            sort,
          },
        },
      ),
    );

    devLog(`${LOG_TAG} discoverSpaces page`, response.page, 'items', response.content.length);
    return response;
  },

  getDiscoverSpace: async (spaceId: UUID): Promise<DiscoverSpaceDetailResponse> => {
    devLog(`${LOG_TAG} GET /spaces/discover/${spaceId}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<DiscoverSpaceDetailResponse>>(
        `/spaces/discover/${spaceId}`,
      ),
    );

    devLog(`${LOG_TAG} getDiscoverSpace`, response.spaceId);
    return response;
  },
};
