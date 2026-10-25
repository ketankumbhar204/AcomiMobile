import apiClient from './client';
import { unwrapApiResponse, unwrapVoidResponse } from './apiRequest';
import type { ApiResponse, PagedResponse, UUID } from './types';

export type ServiceContactSort = 'updated' | 'name' | 'category';

export interface ServiceContactSpace {
  spaceId: UUID;
  name: string;
  type: string;
}

export interface ServiceContact {
  id: UUID;
  businessName: string;
  category: string;
  categoryLabel: string;
  customCategoryName?: string | null;
  contactPersonName?: string | null;
  primaryPhone?: string | null;
  alternatePhone?: string | null;
  whatsappPhone?: string | null;
  email?: string | null;
  description?: string | null;
  address?: string | null;
  notes?: string | null;
  active: boolean;
  canEdit: boolean;
  canArchive: boolean;
  spaces: ServiceContactSpace[];
  version: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ServiceContactCategoryOption {
  code: string;
  label: string;
}

export interface SaveServiceContactBody {
  businessName: string;
  category: string;
  customCategoryName?: string | null;
  contactPersonName?: string | null;
  primaryPhone?: string | null;
  alternatePhone?: string | null;
  whatsappPhone?: string | null;
  email?: string | null;
  description?: string | null;
  address?: string | null;
  notes?: string | null;
  spaceIds?: UUID[] | null;
  acknowledgeDuplicate?: boolean;
  version?: number | null;
}

export interface ServiceContactDuplicateMatch {
  id: UUID;
  businessName: string;
  categoryLabel?: string;
  primaryPhone?: string | null;
  nameAndPhoneMatch?: boolean;
}

export interface ServiceContactListParams {
  q?: string;
  category?: string;
  spaceId?: UUID;
  sort?: ServiceContactSort;
  page?: number;
  size?: number;
}

export const serviceContactsApi = {
  categories: () =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<ServiceContactCategoryOption[]>>('/service-contacts/categories'),
    ),

  list: (params: ServiceContactListParams) =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<ServiceContact>>>('/service-contacts', { params }),
    ),

  get: (contactId: UUID) =>
    unwrapApiResponse(apiClient.get<ApiResponse<ServiceContact>>(`/service-contacts/${contactId}`)),

  create: (body: SaveServiceContactBody) =>
    unwrapApiResponse(apiClient.post<ApiResponse<ServiceContact>>('/service-contacts', body)),

  update: (contactId: UUID, body: SaveServiceContactBody) =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<ServiceContact>>(`/service-contacts/${contactId}`, body),
    ),

  archive: (contactId: UUID) =>
    unwrapVoidResponse(apiClient.post(`/service-contacts/${contactId}/archive`)),
};
