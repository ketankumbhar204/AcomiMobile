import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type {
  ApiResponse,
  MealPollClosingSettings,
  UpdateMealPollClosingSettingsRequest,
  UUID,
} from './types';

const LOG_TAG = '[MealPollClosingApi]';

export const mealPollClosingApi = {
  getSettings: async (spaceId: UUID): Promise<MealPollClosingSettings> => {
    const path = `/spaces/${spaceId}/meal-poll-closing-settings`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(apiClient.get<ApiResponse<MealPollClosingSettings>>(path));
  },

  updateSettings: async (
    spaceId: UUID,
    payload: UpdateMealPollClosingSettingsRequest,
  ): Promise<MealPollClosingSettings> => {
    const path = `/spaces/${spaceId}/meal-poll-closing-settings`;
    console.log(`${LOG_TAG} PUT ${path}`, payload);
    return unwrapApiResponse(
      apiClient.put<ApiResponse<MealPollClosingSettings>>(path, payload),
    );
  },
};
