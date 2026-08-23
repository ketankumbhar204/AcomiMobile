import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type {
  ApiResponse,
  MemberMealBalance,
  MemberMealBalanceActivityEvent,
  MemberSubscriptionHistoryResponse,
  RecordMealBalancePurchaseRequest,
  UUID,
} from './types';
import { normalizeSubscriptionHistoryResponse } from '../utils/subscriptionHistory';
import { devLog } from '../utils/devLog';

const LOG_TAG = '[MealBalanceApi]';

export const mealBalanceApi = {
  getBalance: async (spaceId: UUID, memberId: UUID): Promise<MemberMealBalance> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/members/${memberId}/meal-balance`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MemberMealBalance>>(
        `/spaces/${spaceId}/members/${memberId}/meal-balance`,
      ),
    );
  },

  recordPurchase: async (
    spaceId: UUID,
    memberId: UUID,
    payload: RecordMealBalancePurchaseRequest,
  ): Promise<MemberMealBalance> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/members/${memberId}/meal-balance/purchases`, payload);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MemberMealBalance>>(
        `/spaces/${spaceId}/members/${memberId}/meal-balance/purchases`,
        payload,
      ),
    );
  },

  getActivity: async (
    spaceId: UUID,
    memberId: UUID,
    month: string,
  ): Promise<MemberMealBalanceActivityEvent[]> => {
    const path = `/spaces/${spaceId}/members/${memberId}/meal-balance/activity?month=${encodeURIComponent(month)}`;
    devLog(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(apiClient.get<ApiResponse<MemberMealBalanceActivityEvent[]>>(path));
  },

  endSubscription: async (spaceId: UUID, memberId: UUID): Promise<MemberMealBalance> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/members/${memberId}/meal-balance/end`);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<MemberMealBalance>>(
        `/spaces/${spaceId}/members/${memberId}/meal-balance/end`,
      ),
    );
  },

  getSubscriptionHistory: async (
    spaceId: UUID,
    memberId: UUID,
  ): Promise<MemberSubscriptionHistoryResponse> => {
    const path = `/spaces/${spaceId}/members/${memberId}/meal-balance/subscription-history`;
    devLog(`${LOG_TAG} GET ${path}`);
    const data = await unwrapApiResponse(
      apiClient.get<
        ApiResponse<MemberSubscriptionHistoryResponse | MemberMealBalanceActivityEvent[]>
      >(path),
    );
    return normalizeSubscriptionHistoryResponse(data);
  },
};
