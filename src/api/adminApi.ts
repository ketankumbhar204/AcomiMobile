import { unwrapApiResponse, unwrapVoidResponse } from './apiRequest';
import apiClient from './client';
import type {
  AdminActiveSpace,
  AdminCreateMessRegistrationRequest,
  AdminCreatePropertyRegistrationRequest,
  AdminUpdateRegistrationContactRequest,
  AdminDashboardSummary,
  AdminRegisteredUser,
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
    page?: number;
    size?: number;
  }): Promise<PagedResponse<AdminRegisteredUser>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<AdminRegisteredUser>>>('/admin/registered-users', {
        params,
      }),
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
};
