import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type {
  AddComplaintAttachmentRequest,
  AddComplaintCommentRequest,
  ApiResponse,
  AssignComplaintRequest,
  ComplaintCategory,
  ComplaintListResponse,
  ComplaintPriority,
  ComplaintResponse,
  ComplaintStatus,
  CreateComplaintRequest,
  ListComplaintsParams,
  ReopenComplaintRequest,
  UpdateComplaintResolutionRequest,
  UpdateComplaintStatusRequest,
  UUID,
} from './types';

function buildQuery(params?: ListComplaintsParams): string {
  if (!params) {
    return '';
  }
  const parts: string[] = [];
  if (params.status) {
    parts.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params.priority) {
    parts.push(`priority=${encodeURIComponent(params.priority)}`);
  }
  if (params.category) {
    parts.push(`category=${encodeURIComponent(params.category)}`);
  }
  if (params.assigneeMembershipId) {
    parts.push(`assigneeMembershipId=${encodeURIComponent(params.assigneeMembershipId)}`);
  }
  if (params.mine === true) {
    parts.push('mine=true');
  }
  if (params.mine === false) {
    parts.push('mine=false');
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export const complaintsApi = {
  list: async (spaceId: UUID, params?: ListComplaintsParams): Promise<ComplaintListResponse> => {
    const query = buildQuery(params);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<ComplaintListResponse>>(`/spaces/${spaceId}/complaints${query}`),
    );
  },

  get: async (spaceId: UUID, complaintId: UUID): Promise<ComplaintResponse> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<ComplaintResponse>>(
        `/spaces/${spaceId}/complaints/${complaintId}`,
      ),
    );
  },

  create: async (
    spaceId: UUID,
    body: CreateComplaintRequest,
  ): Promise<ComplaintResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<ComplaintResponse>>(`/spaces/${spaceId}/complaints`, body),
    );
  },

  updateStatus: async (
    spaceId: UUID,
    complaintId: UUID,
    body: UpdateComplaintStatusRequest,
  ): Promise<ComplaintResponse> => {
    return unwrapApiResponse(
      apiClient.patch<ApiResponse<ComplaintResponse>>(
        `/spaces/${spaceId}/complaints/${complaintId}/status`,
        body,
      ),
    );
  },

  addComment: async (
    spaceId: UUID,
    complaintId: UUID,
    body: AddComplaintCommentRequest,
  ): Promise<ComplaintResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<ComplaintResponse>>(
        `/spaces/${spaceId}/complaints/${complaintId}/comments`,
        body,
      ),
    );
  },

  addAttachment: async (
    spaceId: UUID,
    complaintId: UUID,
    body: AddComplaintAttachmentRequest,
  ): Promise<ComplaintResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<ComplaintResponse>>(
        `/spaces/${spaceId}/complaints/${complaintId}/attachments`,
        body,
      ),
    );
  },

  reopen: async (
    spaceId: UUID,
    complaintId: UUID,
    body?: ReopenComplaintRequest,
  ): Promise<ComplaintResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<ComplaintResponse>>(
        `/spaces/${spaceId}/complaints/${complaintId}/reopen`,
        body ?? {},
      ),
    );
  },

  assign: async (
    spaceId: UUID,
    complaintId: UUID,
    body: AssignComplaintRequest,
  ): Promise<ComplaintResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<ComplaintResponse>>(
        `/spaces/${spaceId}/complaints/${complaintId}/assign`,
        body,
      ),
    );
  },

  updateResolution: async (
    spaceId: UUID,
    complaintId: UUID,
    body: UpdateComplaintResolutionRequest,
  ): Promise<ComplaintResponse> => {
    return unwrapApiResponse(
      apiClient.patch<ApiResponse<ComplaintResponse>>(
        `/spaces/${spaceId}/complaints/${complaintId}/resolution`,
        body,
      ),
    );
  },
};

export type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintResponse,
  ComplaintListResponse,
};
