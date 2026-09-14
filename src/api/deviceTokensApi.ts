import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type { ApiResponse } from './types';

export type DevicePlatform = 'ANDROID' | 'IOS' | 'WEB';

export type RegisterDeviceTokenRequest = {
  token: string;
  platform: DevicePlatform;
  deviceId: string;
  appVersion?: string;
};

export type DeviceTokenResponse = {
  deviceTokenId: string;
  deviceId: string;
  platform: DevicePlatform;
  appVersion?: string | null;
  active: boolean;
  lastSeenAt?: string | null;
};

export const deviceTokensApi = {
  register: async (payload: RegisterDeviceTokenRequest): Promise<DeviceTokenResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<DeviceTokenResponse>>('/notifications/devices', payload),
    );
  },

  deactivate: async (deviceId: string): Promise<void> => {
    await unwrapApiResponse(
      apiClient.delete<ApiResponse<null>>(`/notifications/devices/${encodeURIComponent(deviceId)}`),
    );
  },
};
