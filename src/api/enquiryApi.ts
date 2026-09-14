import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type {
  AdminSpaceEnquiryDetail,
  AdminSpaceEnquiryListItem,
  ApiResponse,
  CreateSpaceEnquiryRequest,
  NotificationListResponse,
  PagedResponse,
  SpaceEnquiryResponse,
  SpaceEnquiryStatus,
  SpaceNotification,
  UserNotification,
  UserNotificationListResponse,
  UUID,
} from './types';

export const enquiryApi = {
  create: async (
    spaceId: UUID,
    payload: CreateSpaceEnquiryRequest = {},
  ): Promise<SpaceEnquiryResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceEnquiryResponse>>(
        `/spaces/${spaceId}/enquiries`,
        payload,
      ),
    ),

  listMine: async (params?: {
    page?: number;
    size?: number;
  }): Promise<PagedResponse<SpaceEnquiryResponse>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<SpaceEnquiryResponse>>>('/enquiries/me', {
        params,
      }),
    ),

  listNotifications: async (params?: {
    page?: number;
    size?: number;
  }): Promise<UserNotificationListResponse> => {
    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<UserNotificationListResponse>>('/notifications/me', {
        params,
      }),
    );
    return {
      notifications: response.notifications ?? [],
      unreadCount: response.unreadCount ?? 0,
      page: response.page,
      size: response.size,
      totalElements: response.totalElements,
      totalPages: response.totalPages,
    };
  },

  markNotificationRead: async (notificationId: UUID): Promise<UserNotification> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<UserNotification>>(
        `/notifications/${notificationId}/read`,
      ),
    ),
};

export const adminEnquiryApi = {
  list: async (params?: {
    status?: SpaceEnquiryStatus;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<AdminSpaceEnquiryListItem>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<AdminSpaceEnquiryListItem>>>(
        '/admin/enquiries',
        { params },
      ),
    ),

  get: async (enquiryId: UUID): Promise<AdminSpaceEnquiryDetail> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminSpaceEnquiryDetail>>(
        `/admin/enquiries/${enquiryId}`,
      ),
    ),

  share: async (enquiryId: UUID): Promise<AdminSpaceEnquiryDetail> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AdminSpaceEnquiryDetail>>(
        `/admin/enquiries/${enquiryId}/share`,
      ),
    ),

  reject: async (enquiryId: UUID, reason?: string): Promise<AdminSpaceEnquiryDetail> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AdminSpaceEnquiryDetail>>(
        `/admin/enquiries/${enquiryId}/reject`,
        { reason },
      ),
    ),

  listNotifications: async (): Promise<NotificationListResponse> => {
    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<NotificationListResponse>>('/admin/notifications'),
    );
    return {
      notifications: response.notifications ?? [],
      unreadCount: response.unreadCount ?? 0,
    };
  },

  markNotificationRead: async (notificationId: UUID): Promise<SpaceNotification> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceNotification>>(
        `/admin/notifications/${notificationId}/read`,
      ),
    ),
};
