import { unwrapApiResponse, unwrapVoidResponse } from './apiRequest';
import apiClient from './client';
import type { ApiResponse, UUID } from './types';

export type FilePurpose =
  | 'PROFILE_PHOTO'
  | 'IDENTITY_DOCUMENT'
  | 'ADDRESS_PROOF'
  | 'MEMBER_DOCUMENT'
  | 'PAYMENT_PROOF'
  | 'MEAL_PAYMENT_PROOF'
  | 'SUBSCRIPTION_PAYMENT_PROOF'
  | 'COMPLAINT_ATTACHMENT'
  | 'BUILDING_PHOTO'
  | 'FLOOR_PHOTO'
  | 'UNIT_PHOTO'
  | 'ROOM_PHOTO'
  | 'BED_PHOTO'
  | 'MENU_ITEM_PHOTO'
  | 'COMBO_PHOTO'
  | 'SPACE_PHOTO';

export type FileStatus = 'PENDING' | 'ACTIVE' | 'PENDING_DELETE' | 'DELETED' | 'FAILED';

export interface CreateUploadSessionRequest {
  purpose: FilePurpose;
  spaceId?: UUID;
  memberId?: UUID;
  paymentId?: UUID;
  complaintId?: UUID;
  pollDate?: string;
  contentType: string;
  byteSize: number;
  originalFilename?: string;
}

export interface UploadSessionResponse {
  fileId: UUID;
  purpose: FilePurpose;
  status: FileStatus;
  uploadUrl: string;
  uploadMethod: string;
  uploadHeaders?: Record<string, string> | null;
  expiresAt?: string | null;
  useAcomiUploadProxy: boolean;
}

export interface StoredFileResponse {
  fileId: UUID;
  purpose: FilePurpose;
  status: FileStatus;
  contentType: string;
  byteSize?: number | null;
  originalFilename?: string | null;
}

export interface ContentUrlResponse {
  fileId: UUID;
  contentUrl: string;
  contentType: string;
  originalFilename?: string | null;
  downloadFilename?: string | null;
  expiresAt: string;
}

export const filesApi = {
  createUploadSession: async (
    body: CreateUploadSessionRequest,
  ): Promise<UploadSessionResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<UploadSessionResponse>>('/files/upload-sessions', body),
    );
  },

  complete: async (fileId: UUID): Promise<StoredFileResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<StoredFileResponse>>(`/files/${fileId}/complete`),
    );
  },

  getMetadata: async (fileId: UUID): Promise<StoredFileResponse> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<StoredFileResponse>>(`/files/${fileId}`),
    );
  },

  getContentUrl: async (fileId: UUID): Promise<ContentUrlResponse> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<ContentUrlResponse>>(`/files/${fileId}/content-url`),
    );
  },

  putContent: async (fileId: UUID, body: Blob | ArrayBuffer, contentType: string): Promise<void> => {
    await unwrapVoidResponse(
      apiClient.put<ApiResponse<unknown>>(`/files/${fileId}/content`, body, {
        headers: {
          'Content-Type': contentType,
          Accept: 'application/json',
        },
        transformRequest: [data => data],
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }),
    );
  },

  delete: async (fileId: UUID): Promise<void> => {
    await unwrapVoidResponse(apiClient.delete(`/files/${fileId}`));
  },
};
