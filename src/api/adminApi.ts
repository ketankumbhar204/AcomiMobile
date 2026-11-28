import { unwrapApiResponse, unwrapVoidResponse } from './apiRequest';
import apiClient from './client';
import type {
  AdminActiveSpace,
  AdminCreateMessRegistrationRequest,
  AdminCreatePropertyRegistrationRequest,
  AdminCreateRegisteredUserRequest,
  AdminListingMarketingResponse,
  AdminListingMarketingTemplate,
  AdminListingMarketingWhatsAppCapability,
  AdminSendListingMarketingWhatsAppRequest,
  AdminSendListingMarketingWhatsAppResponse,
  AdminUpsertListingMarketingTemplateRequest,
  AdminUpdateListingMarketingRequest,
  AdminUpdateRegistrationContactRequest,
  AdminDashboardSummary,
  AdminRegisteredUser,
  AdminRegisteredUsersSummary,
  ListingMarketingStatus,
  SavedAddress,
  SavedAddressRequest,
  ApiResponse,
  MessRegistrationDetail,
  MessRegistrationListItem,
  MessRegistrationResponse,
  PagedResponse,
  PropertyRegistrationDetail,
  PropertyRegistrationListItem,
  PropertyRegistrationResponse,
  SpaceType,
  WhatsAppAvailability,
} from './types';

export const adminApi = {
  getDashboardSummary: async (): Promise<AdminDashboardSummary> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminDashboardSummary>>('/admin/dashboard/summary'),
    ),

  listActiveSpaces: async (type?: SpaceType): Promise<AdminActiveSpace[]> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminActiveSpace[]>>('/admin/dashboard/active-spaces', {
        params: type ? { type } : undefined,
      }),
    ),

  listPropertyRegistrations: async (params?: {
    source?: 'ADMIN' | 'PUBLIC_WEBSITE';
    leadsOnly?: boolean;
    marketingStatus?: ListingMarketingStatus;
    whatsappAvailability?: WhatsAppAvailability;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<PropertyRegistrationListItem>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<PropertyRegistrationListItem>>>(
        '/admin/property-registrations',
        { params },
      ),
    ),

  getPropertyRegistration: async (id: string): Promise<PropertyRegistrationDetail> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PropertyRegistrationDetail>>(
        `/admin/property-registrations/${id}`,
      ),
    ),

  createPropertyRegistration: async (
    payload: AdminCreatePropertyRegistrationRequest,
  ): Promise<PropertyRegistrationResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<PropertyRegistrationResponse>>(
        '/admin/property-registrations',
        payload,
      ),
    ),

  updatePropertyRegistrationContact: async (
    id: string,
    payload: AdminUpdateRegistrationContactRequest,
  ): Promise<PropertyRegistrationDetail> =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<PropertyRegistrationDetail>>(
        `/admin/property-registrations/${id}/contact`,
        payload,
      ),
    ),

  deletePropertyRegistration: async (id: string): Promise<void> =>
    unwrapVoidResponse(
      apiClient.delete(`/admin/property-registrations/${id}`),
    ),

  listMessRegistrations: async (params?: {
    source?: 'ADMIN' | 'PUBLIC_WEBSITE';
    leadsOnly?: boolean;
    marketingStatus?: ListingMarketingStatus;
    whatsappAvailability?: WhatsAppAvailability;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<MessRegistrationListItem>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<MessRegistrationListItem>>>(
        '/admin/mess-registrations',
        { params },
      ),
    ),

  getMessRegistration: async (id: string): Promise<MessRegistrationDetail> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<MessRegistrationDetail>>(`/admin/mess-registrations/${id}`),
    ),

  createMessRegistration: async (
    payload: AdminCreateMessRegistrationRequest,
  ): Promise<MessRegistrationResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<MessRegistrationResponse>>(
        '/admin/mess-registrations',
        payload,
      ),
    ),

  updateMessRegistrationContact: async (
    id: string,
    payload: AdminUpdateRegistrationContactRequest,
  ): Promise<MessRegistrationDetail> =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<MessRegistrationDetail>>(
        `/admin/mess-registrations/${id}/contact`,
        payload,
      ),
    ),

  deleteMessRegistration: async (id: string): Promise<void> =>
    unwrapVoidResponse(apiClient.delete(`/admin/mess-registrations/${id}`)),

  listRegisteredUsers: async (params?: {
    q?: string;
    role?: string;
    onboarding?: string;
    spaceAssociation?: string;
    verified?: boolean;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<AdminRegisteredUser>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<AdminRegisteredUser>>>('/admin/registered-users', {
        params,
      }),
    ),

  getRegisteredUsersSummary: async (): Promise<AdminRegisteredUsersSummary> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminRegisteredUsersSummary>>('/admin/registered-users/summary'),
    ),

  createRegisteredUser: async (
    payload: AdminCreateRegisteredUserRequest,
  ): Promise<AdminRegisteredUser> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AdminRegisteredUser>>('/admin/registered-users', payload),
    ),

  resetRegisteredUserPassword: async (
    id: string,
    payload: { password: string; confirmPassword: string },
  ): Promise<void> =>
    unwrapVoidResponse(
      apiClient.post(`/admin/registered-users/${id}/reset-password`, payload),
    ),

  listSavedAddresses: async (params?: {
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PagedResponse<SavedAddress>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<SavedAddress>>>('/admin/saved-addresses', {
        params,
      }),
    ),

  updateSavedAddress: async (id: string, payload: SavedAddressRequest): Promise<SavedAddress> =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<SavedAddress>>(`/admin/saved-addresses/${id}`, payload),
    ),

  deleteSavedAddress: async (id: string): Promise<void> =>
    unwrapVoidResponse(apiClient.delete(`/admin/saved-addresses/${id}`)),

  getPropertyRegistrationMarketing: async (id: string): Promise<AdminListingMarketingResponse> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminListingMarketingResponse>>(
        `/admin/property-registrations/${id}/marketing`,
      ),
    ),

  updatePropertyRegistrationMarketing: async (
    id: string,
    payload: AdminUpdateListingMarketingRequest,
  ): Promise<AdminListingMarketingResponse> =>
    unwrapApiResponse(
      apiClient.patch<ApiResponse<AdminListingMarketingResponse>>(
        `/admin/property-registrations/${id}/marketing`,
        payload,
      ),
    ),

  getMessRegistrationMarketing: async (id: string): Promise<AdminListingMarketingResponse> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminListingMarketingResponse>>(
        `/admin/mess-registrations/${id}/marketing`,
      ),
    ),

  updateMessRegistrationMarketing: async (
    id: string,
    payload: AdminUpdateListingMarketingRequest,
  ): Promise<AdminListingMarketingResponse> =>
    unwrapApiResponse(
      apiClient.patch<ApiResponse<AdminListingMarketingResponse>>(
        `/admin/mess-registrations/${id}/marketing`,
        payload,
      ),
    ),

  getSpaceMarketing: async (spaceId: string): Promise<AdminListingMarketingResponse> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminListingMarketingResponse>>(
        `/admin/spaces/${spaceId}/marketing`,
      ),
    ),

  updateSpaceMarketing: async (
    spaceId: string,
    payload: AdminUpdateListingMarketingRequest,
  ): Promise<AdminListingMarketingResponse> =>
    unwrapApiResponse(
      apiClient.patch<ApiResponse<AdminListingMarketingResponse>>(
        `/admin/spaces/${spaceId}/marketing`,
        payload,
      ),
    ),

  getListingMarketingWhatsAppCapability: async (): Promise<AdminListingMarketingWhatsAppCapability> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminListingMarketingWhatsAppCapability>>(
        '/admin/listing-marketing/whatsapp-capability',
      ),
    ),

  sendListingMarketingWhatsApp: async (
    target: { kind: 'property-registration' | 'mess-registration' | 'space'; id: string },
    payload: AdminSendListingMarketingWhatsAppRequest,
  ): Promise<AdminSendListingMarketingWhatsAppResponse> => {
    const path =
      target.kind === 'property-registration'
        ? `/admin/property-registrations/${target.id}/marketing/send-whatsapp`
        : target.kind === 'mess-registration'
          ? `/admin/mess-registrations/${target.id}/marketing/send-whatsapp`
          : `/admin/spaces/${target.id}/marketing/send-whatsapp`;
    return unwrapApiResponse(
      apiClient.post<ApiResponse<AdminSendListingMarketingWhatsAppResponse>>(path, payload),
    );
  },

  listListingMarketingTemplates: async (params?: {
    activeOnly?: boolean;
  }): Promise<AdminListingMarketingTemplate[]> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<AdminListingMarketingTemplate[]>>(
        '/admin/listing-marketing-templates',
        { params },
      ),
    ),

  createListingMarketingTemplate: async (
    payload: AdminUpsertListingMarketingTemplateRequest,
  ): Promise<AdminListingMarketingTemplate> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AdminListingMarketingTemplate>>(
        '/admin/listing-marketing-templates',
        payload,
      ),
    ),

  updateListingMarketingTemplate: async (
    id: string,
    payload: AdminUpsertListingMarketingTemplateRequest,
  ): Promise<AdminListingMarketingTemplate> =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<AdminListingMarketingTemplate>>(
        `/admin/listing-marketing-templates/${id}`,
        payload,
      ),
    ),

  duplicateListingMarketingTemplate: async (id: string): Promise<AdminListingMarketingTemplate> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AdminListingMarketingTemplate>>(
        `/admin/listing-marketing-templates/${id}/duplicate`,
      ),
    ),

  deleteListingMarketingTemplate: async (id: string): Promise<void> =>
    unwrapVoidResponse(apiClient.delete(`/admin/listing-marketing-templates/${id}`)),
};
