import { unwrapApiResponse, unwrapVoidResponse } from './apiRequest';
import apiClient from './client';
import {
  AcceptInvitationRequest,
  ApiResponse,
  CreateInvitationRequest,
  CreateMemberDocumentRequest,
  CreateMemberNoteRequest,
  CreateMemberRequest,
  ImportMemberRequest,
  InvitationResponse,
  MemberDetailsResponse,
  MemberDocumentResponse,
  MemberHistoryResponse,
  MemberImportCandidateResponse,
  MemberNoteResponse,
  MemberResponse,
  MemberSearchParams,
  MyInvitationResponse,
  PendingInvitationResponse,
  SpaceMembershipResponse,
  UpdateDepositRequest,
  UpdateEmergencyContactRequest,
  UpdateMemberRequest,
  UpdateMemberStatusRequest,
  UUID,
} from './types';
import { devLog } from '../utils/devLog';

const LOG_TAG = '[MemberApi]';

export const PENDING_UPLOAD_FILE_URL = 'pending-upload';

export const memberApi = {
  createMember: async (
    spaceId: UUID,
    body: CreateMemberRequest,
  ): Promise<MemberResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/members`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<MemberResponse>>(
        `/spaces/${spaceId}/members`,
        body,
      ),
    );

    devLog(`${LOG_TAG} createMember response`, response.memberId);
    return response;
  },

  getMembers: async (
    spaceId: UUID,
    params?: MemberSearchParams,
  ): Promise<MemberResponse[]> => {
    const q = new URLSearchParams();
    if (params?.search?.trim()) {
      q.set('search', params.search.trim());
    }
    if (params?.occupancyStatus) {
      q.set('occupancyStatus', params.occupancyStatus);
    }
    const query = q.toString();
    const path = `/spaces/${spaceId}/members${query ? `?${query}` : ''}`;
    devLog(`${LOG_TAG} GET ${path}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MemberResponse[]>>(path),
    );

    devLog(`${LOG_TAG} getMembers response`, response.length);
    return response;
  },

  searchImportCandidates: async (
    spaceId: UUID,
    search?: string,
  ): Promise<MemberImportCandidateResponse[]> => {
    const q = new URLSearchParams();
    if (search?.trim()) {
      q.set('search', search.trim());
    }
    const query = q.toString();
    const path = `/spaces/${spaceId}/members/import-candidates${query ? `?${query}` : ''}`;
    devLog(`${LOG_TAG} GET ${path}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MemberImportCandidateResponse[]>>(path),
    );

    devLog(`${LOG_TAG} searchImportCandidates response`, response.length);
    return response;
  },

  importMember: async (
    spaceId: UUID,
    body: ImportMemberRequest,
  ): Promise<MemberResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/members/import`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<MemberResponse>>(
        `/spaces/${spaceId}/members/import`,
        body,
      ),
    );

    devLog(`${LOG_TAG} importMember response`, response.memberId);
    return response;
  },

  getMyLinkedMember: async (spaceId: UUID): Promise<MemberResponse> => {
    const path = `/spaces/${spaceId}/members/me`;
    devLog(`${LOG_TAG} GET ${path}`);

    return unwrapApiResponse(apiClient.get<ApiResponse<MemberResponse>>(path));
  },

  getMember: async (
    spaceId: UUID,
    memberId: UUID,
  ): Promise<MemberDetailsResponse> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/members/${memberId}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MemberDetailsResponse>>(
        `/spaces/${spaceId}/members/${memberId}`,
      ),
    );

    devLog(`${LOG_TAG} getMember response`, response.memberId);
    return response;
  },

  updateMember: async (
    spaceId: UUID,
    memberId: UUID,
    body: UpdateMemberRequest,
  ): Promise<MemberDetailsResponse> => {
    devLog(`${LOG_TAG} PUT /spaces/${spaceId}/members/${memberId}`, body);

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<MemberDetailsResponse>>(
        `/spaces/${spaceId}/members/${memberId}`,
        body,
      ),
    );

    devLog(`${LOG_TAG} updateMember response`, response.memberId);
    return response;
  },

  removeMember: async (spaceId: UUID, memberId: UUID): Promise<void> => {
    devLog(`${LOG_TAG} DELETE /spaces/${spaceId}/members/${memberId}`);

    await unwrapVoidResponse(
      apiClient.delete(`/spaces/${spaceId}/members/${memberId}`),
    );

    devLog(`${LOG_TAG} removeMember success`);
  },

  updateMemberStatus: async (
    spaceId: UUID,
    memberId: UUID,
    body: UpdateMemberStatusRequest,
  ): Promise<MemberDetailsResponse> => {
    devLog(`${LOG_TAG} PUT /spaces/${spaceId}/members/${memberId}/status`, body);

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<MemberDetailsResponse>>(
        `/spaces/${spaceId}/members/${memberId}/status`,
        body,
      ),
    );

    devLog(`${LOG_TAG} updateMemberStatus response`, response.status);
    return response;
  },

  updateEmergencyContact: async (
    spaceId: UUID,
    memberId: UUID,
    body: UpdateEmergencyContactRequest,
  ): Promise<MemberDetailsResponse> => {
    devLog(`${LOG_TAG} PUT /spaces/${spaceId}/members/${memberId}/emergency-contact`, body);

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<MemberDetailsResponse>>(
        `/spaces/${spaceId}/members/${memberId}/emergency-contact`,
        body,
      ),
    );

    devLog(`${LOG_TAG} updateEmergencyContact response`, response.memberId);
    return response;
  },

  updateDeposit: async (
    spaceId: UUID,
    memberId: UUID,
    body: UpdateDepositRequest,
  ): Promise<MemberDetailsResponse> => {
    devLog(`${LOG_TAG} PUT /spaces/${spaceId}/members/${memberId}/deposit`, body);

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<MemberDetailsResponse>>(
        `/spaces/${spaceId}/members/${memberId}/deposit`,
        body,
      ),
    );

    devLog(`${LOG_TAG} updateDeposit response`, response.depositBalance);
    return response;
  },

  addMemberDocument: async (
    spaceId: UUID,
    memberId: UUID,
    body: CreateMemberDocumentRequest,
  ): Promise<MemberDocumentResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/members/${memberId}/documents`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<MemberDocumentResponse>>(
        `/spaces/${spaceId}/members/${memberId}/documents`,
        body,
      ),
    );

    devLog(`${LOG_TAG} addMemberDocument response`, response.documentId);
    return response;
  },

  getMemberDocuments: async (
    spaceId: UUID,
    memberId: UUID,
  ): Promise<MemberDocumentResponse[]> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/members/${memberId}/documents`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MemberDocumentResponse[]>>(
        `/spaces/${spaceId}/members/${memberId}/documents`,
      ),
    );

    devLog(`${LOG_TAG} getMemberDocuments response`, response.length);
    return response;
  },

  deleteMemberDocument: async (
    spaceId: UUID,
    memberId: UUID,
    documentId: UUID,
  ): Promise<void> => {
    devLog(`${LOG_TAG} DELETE /spaces/${spaceId}/members/${memberId}/documents/${documentId}`);

    await unwrapVoidResponse(
      apiClient.delete(
        `/spaces/${spaceId}/members/${memberId}/documents/${documentId}`,
      ),
    );

    devLog(`${LOG_TAG} deleteMemberDocument success`);
  },

  addMemberNote: async (
    spaceId: UUID,
    memberId: UUID,
    body: CreateMemberNoteRequest,
  ): Promise<MemberNoteResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/members/${memberId}/notes`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<MemberNoteResponse>>(
        `/spaces/${spaceId}/members/${memberId}/notes`,
        body,
      ),
    );

    devLog(`${LOG_TAG} addMemberNote response`, response.noteId);
    return response;
  },

  getMemberNotes: async (
    spaceId: UUID,
    memberId: UUID,
  ): Promise<MemberNoteResponse[]> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/members/${memberId}/notes`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MemberNoteResponse[]>>(
        `/spaces/${spaceId}/members/${memberId}/notes`,
      ),
    );

    devLog(`${LOG_TAG} getMemberNotes response`, response.length);
    return response;
  },

  getMemberHistory: async (
    spaceId: UUID,
    memberId: UUID,
  ): Promise<MemberHistoryResponse[]> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/members/${memberId}/history`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MemberHistoryResponse[]>>(
        `/spaces/${spaceId}/members/${memberId}/history`,
      ),
    );

    devLog(`${LOG_TAG} getMemberHistory response`, response.length);
    return response;
  },

  createInvitation: async (
    body: CreateInvitationRequest,
  ): Promise<InvitationResponse> => {
    devLog(`${LOG_TAG} POST /invitations`, body.spaceId);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<InvitationResponse>>('/invitations', body),
    );

    devLog(`${LOG_TAG} createInvitation response`, response.id);
    return response;
  },

  acceptInvitation: async (
    invitationId: UUID,
    body: AcceptInvitationRequest,
  ): Promise<SpaceMembershipResponse> => {
    devLog(`${LOG_TAG} POST /invitations/${invitationId}/accept`);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceMembershipResponse>>(
        `/invitations/${invitationId}/accept`,
        body,
      ),
    );

    devLog(`${LOG_TAG} acceptInvitation response`, response.spaceId);
    return response;
  },

  cancelInvitation: async (invitationId: UUID): Promise<void> => {
    devLog(`${LOG_TAG} DELETE /invitations/${invitationId}`);

    await unwrapVoidResponse(
      apiClient.delete(`/invitations/${invitationId}`),
    );

    devLog(`${LOG_TAG} cancelInvitation success`);
  },

  getPendingInvitations: async (
    spaceId: UUID,
  ): Promise<PendingInvitationResponse[]> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/invitations`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PendingInvitationResponse[]>>(
        `/spaces/${spaceId}/invitations`,
      ),
    );

    devLog(`${LOG_TAG} getPendingInvitations response`, response.length);
    return response;
  },

  getMyInvitations: async (): Promise<MyInvitationResponse[]> => {
    devLog(`${LOG_TAG} GET /invitations/my`);
    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MyInvitationResponse[]>>('/invitations/my'),
    );
    devLog(`${LOG_TAG} getMyInvitations response`, response.length);
    return response;
  },
};
