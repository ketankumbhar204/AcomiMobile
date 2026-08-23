import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type {
  ApiResponse,
  MealBillingSettings,
  UpdateMealBillingSettingsRequest,
  UUID,
} from './types';
import { devLog } from '../utils/devLog';

const LOG_TAG = '[MealBillingApi]';

export const mealBillingApi = {
  getSettings: async (spaceId: UUID): Promise<MealBillingSettings> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/meal-billing-settings`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MealBillingSettings>>(
        `/spaces/${spaceId}/meal-billing-settings`,
      ),
    );
  },

  updateSettings: async (
    spaceId: UUID,
    payload: UpdateMealBillingSettingsRequest,
  ): Promise<MealBillingSettings> => {
    devLog(`${LOG_TAG} PUT /spaces/${spaceId}/meal-billing-settings`, payload);
    return unwrapApiResponse(
      apiClient.put<ApiResponse<MealBillingSettings>>(
        `/spaces/${spaceId}/meal-billing-settings`,
        payload,
      ),
    );
  },
};
