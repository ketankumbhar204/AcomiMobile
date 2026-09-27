import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import { DISCOVER_PAGE_SIZE, buildDiscoverSearchParams } from './discoverQuery';
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
    const query = buildDiscoverSearchParams({
      ...params,
      size: params.size ?? DISCOVER_PAGE_SIZE,
    });

    devLog(`${LOG_TAG} GET /spaces/discover`, Object.fromEntries(query.entries()));

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<DiscoverSpaceCardResponse>>>(
        `/spaces/discover?${query.toString()}`,
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
