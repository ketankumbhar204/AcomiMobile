import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type {
  ApiResponse,
  SpaceBillingSettings,
  UpdateSpaceBillingSettingsRequest,
  UUID,
} from './types';
import { devLog } from '../utils/devLog';

const LOG_TAG = '[BillingSettingsApi]';

export const billingSettingsApi = {
  getSettings: async (spaceId: UUID): Promise<SpaceBillingSettings> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/billing-settings`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<SpaceBillingSettings>>(
        `/spaces/${spaceId}/billing-settings`,
      ),
    );
  },

  updateSettings: async (
    spaceId: UUID,
    payload: UpdateSpaceBillingSettingsRequest,
  ): Promise<SpaceBillingSettings> => {
    devLog(`${LOG_TAG} PUT /spaces/${spaceId}/billing-settings`, payload);
    return unwrapApiResponse(
      apiClient.put<ApiResponse<SpaceBillingSettings>>(
        `/spaces/${spaceId}/billing-settings`,
        payload,
      ),
    );
  },
};
