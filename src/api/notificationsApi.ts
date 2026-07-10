import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type { ApiResponse, PendingActionsSummary, SpaceNotification, UUID } from './types';
import { currentMonthKey } from '../utils/dashboardFinancial';
import { normalizePendingActionsSummary } from '../utils/normalizeDashboardSummary';

export type NotificationListResponse = {
  notifications: SpaceNotification[];
  unreadCount: number;
};

export const notificationsApi = {
  getPendingActions: async (
    spaceId: UUID,
    month = currentMonthKey(),
  ): Promise<PendingActionsSummary> => {
    const path = `/spaces/${spaceId}/pending-actions?month=${month}`;
    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PendingActionsSummary>>(path),
    );
    return normalizePendingActionsSummary(response);
  },

  listNotifications: async (
    spaceId: UUID,
    actionableOnly = false,
  ): Promise<NotificationListResponse> => {
    const path = `/spaces/${spaceId}/notifications?actionableOnly=${actionableOnly}`;
    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<NotificationListResponse>>(path),
    );
    return {
      notifications: response.notifications ?? [],
      unreadCount: response.unreadCount ?? 0,
    };
  },

  markRead: async (spaceId: UUID, notificationId: UUID): Promise<SpaceNotification> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceNotification>>(
        `/spaces/${spaceId}/notifications/${notificationId}/read`,
      ),
    );
  },

  resolve: async (spaceId: UUID, notificationId: UUID): Promise<SpaceNotification> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceNotification>>(
        `/spaces/${spaceId}/notifications/${notificationId}/resolve`,
      ),
    );
  },
};
