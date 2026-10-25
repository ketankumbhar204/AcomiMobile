import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import { ApiError } from './types';
import type {
  AdminSpaceEnquiryDetail,
  AdminSpaceEnquiryListItem,
  ApiResponse,
  CreateSpaceEnquiryRequest,
  NotificationListResponse,
  PagedResponse,
  OwnerContactResponse,
  EnquiryInboxResponse,
  ReceivedEnquiry,
  ReceivedEnquirySummary,
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

  requestPhotos: async (spaceId: UUID) =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<{
        notificationPersisted: boolean;
        notificationDuplicate: boolean;
        fcmQueued: boolean;
        phoneAvailable: boolean;
        internationalPhone?: string | null;
      }>>(`/spaces/${spaceId}/photo-requests`),
    ),

  revealedContact: async (spaceId: UUID): Promise<OwnerContactResponse | null> => {
    try {
      return await unwrapApiResponse(
        apiClient.get<ApiResponse<OwnerContactResponse>>(`/spaces/${spaceId}/revealed-contact`),
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  sendAgain: async (spaceId: UUID): Promise<SpaceEnquiryResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceEnquiryResponse>>(
        `/spaces/${spaceId}/enquiries/send-again`,
      ),
    ),

  listInquiredListingIds: async (): Promise<
    Array<{
      id: string;
      sentVia: 'EMAIL' | 'APP' | 'BOTH' | null;
      sentToEmail: string | null;
      sentAt: string | null;
      contactViewed: boolean;
    }>
  > => {
    const data = await unwrapApiResponse(
      apiClient.get<ApiResponse<{
        inquiredListingIds?: string[];
        inquiries?: {
          listingId?: string;
          sentVia?: string;
          sentToEmail?: string | null;
          sentAt?: string | null;
          contactViewed?: boolean;
        }[];
      }>>('/enquiries/me/listing-ids'),
    );
    const asVia = (value: string | undefined): 'EMAIL' | 'APP' | 'BOTH' | null =>
      value === 'EMAIL' || value === 'APP' || value === 'BOTH' ? value : null;
    if (data.inquiries?.length) {
      return data.inquiries.flatMap(row => {
        const id = row.listingId?.trim();
        if (!id) return [];
        return [{
          id,
          sentVia: asVia(row.sentVia),
          sentToEmail: row.sentToEmail?.trim() || null,
          sentAt: row.sentAt?.trim() || null,
          contactViewed: row.contactViewed === true,
        }];
      });
    }
    return (data.inquiredListingIds ?? []).map(id => ({
      id,
      sentVia: null,
      sentToEmail: null,
      sentAt: null,
      contactViewed: false,
    }));
  },

  inbox: async (): Promise<EnquiryInboxResponse> =>
    unwrapApiResponse(apiClient.get<ApiResponse<EnquiryInboxResponse>>('/enquiries/inbox')),

  listReceived: async (params?: {
    spaceId?: UUID;
    status?: SpaceEnquiryStatus;
    from?: string;
    to?: string;
    q?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<ReceivedEnquiry>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<ReceivedEnquiry>>>('/enquiries/received', {
        params,
      }),
    ),

  receivedSummary: async (spaceId?: UUID): Promise<ReceivedEnquirySummary> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<ReceivedEnquirySummary>>('/enquiries/received/summary', {
        params: spaceId ? { spaceId } : undefined,
      }),
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
