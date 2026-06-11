import { unwrapApiResponse, unwrapVoidResponse } from './apiRequest';
import apiClient from './client';
import {
  AcceptInvitationRequest,
  ApiResponse,
  CreateInvitationRequest,
  CreateMemberDocumentRequest,
  CreateMemberNoteRequest,
  CreateMemberRequest,
  InvitationResponse,
  MemberDetailsResponse,
  MemberDocumentResponse,
  MemberHistoryResponse,
  MemberNoteResponse,
  MemberResponse,
  PendingInvitationResponse,
  SpaceMembershipResponse,
  UpdateDepositRequest,
  UpdateEmergencyContactRequest,
  UpdateMemberRequest,
  UpdateMemberStatusRequest,
  UUID,
} from './types';

const LOG_TAG = '[MemberApi]';

export const PENDING_UPLOAD_FILE_URL = 'pending-upload';

export const memberApi = {
  createMember: async (
    spaceId: UUID,
    body: CreateMemberRequest,
  ): Promise<MemberResponse> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/members`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<MemberResponse>>(
        `/spaces/${spaceId}/members`,
        body,
      ),
    );

    console.log(`${LOG_TAG} createMember response`, response.memberId);
    return response;
  },

  getMembers: async (spaceId: UUID): Promise<MemberResponse[]> => {
    console.log(`${LOG_TAG} GET /spaces/${spaceId}/members`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MemberResponse[]>>(
        `/spaces/${spaceId}/members`,
      ),
    );

    console.log(`${LOG_TAG} getMembers response`, response.length);
    return response;
  },

  getMember: async (
    spaceId: UUID,
    memberId: UUID,
  ): Promise<MemberDetailsResponse> => {
    console.log(`${LOG_TAG} GET /spaces/${spaceId}/members/${memberId}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MemberDetailsResponse>>(
        `/spaces/${spaceId}/members/${memberId}`,
      ),
    );

    console.log(`${LOG_TAG} getMember response`, response.memberId);
    return response;
  },

  updateMember: async (
    spaceId: UUID,
    memberId: UUID,
    body: UpdateMemberRequest,
  ): Promise<MemberDetailsResponse> => {
    console.log(`${LOG_TAG} PUT /spaces/${spaceId}/members/${memberId}`, body);

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<MemberDetailsResponse>>(
        `/spaces/${spaceId}/members/${memberId}`,
        body,
      ),
    );

    console.log(`${LOG_TAG} updateMember response`, response.memberId);
    return response;
  },

  removeMember: async (spaceId: UUID, memberId: UUID): Promise<void> => {
    console.log(`${LOG_TAG} DELETE /spaces/${spaceId}/members/${memberId}`);

    await unwrapVoidResponse(
      apiClient.delete(`/spaces/${spaceId}/members/${memberId}`),
    );

    console.log(`${LOG_TAG} removeMember success`);
  },

  updateMemberStatus: async (
    spaceId: UUID,
    memberId: UUID,
    body: UpdateMemberStatusRequest,
  ): Promise<MemberDetailsResponse> => {
    console.log(`${LOG_TAG} PUT /spaces/${spaceId}/members/${memberId}/status`, body);

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<MemberDetailsResponse>>(
        `/spaces/${spaceId}/members/${memberId}/status`,
        body,
      ),
    );

    console.log(`${LOG_TAG} updateMemberStatus response`, response.status);
    return response;
  },

  updateEmergencyContact: async (
    spaceId: UUID,
    memberId: UUID,
    body: UpdateEmergencyContactRequest,
  ): Promise<MemberDetailsResponse> => {
    console.log(`${LOG_TAG} PUT /spaces/${spaceId}/members/${memberId}/emergency-contact`, body);

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<MemberDetailsResponse>>(
        `/spaces/${spaceId}/members/${memberId}/emergency-contact`,
        body,
      ),
    );

    console.log(`${LOG_TAG} updateEmergencyContact response`, response.memberId);
    return response;
  },

  updateDeposit: async (
    spaceId: UUID,
    memberId: UUID,
    body: UpdateDepositRequest,
  ): Promise<MemberDetailsResponse> => {
    console.log(`${LOG_TAG} PUT /spaces/${spaceId}/members/${memberId}/deposit`, body);

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<MemberDetailsResponse>>(
        `/spaces/${spaceId}/members/${memberId}/deposit`,
        body,
      ),
    );

    console.log(`${LOG_TAG} updateDeposit response`, response.depositBalance);
    return response;
  },

  addMemberDocument: async (
    spaceId: UUID,
    memberId: UUID,
    body: CreateMemberDocumentRequest,
  ): Promise<MemberDocumentResponse> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/members/${memberId}/documents`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<MemberDocumentResponse>>(
        `/spaces/${spaceId}/members/${memberId}/documents`,
        body,
      ),
    );

    console.log(`${LOG_TAG} addMemberDocument response`, response.documentId);
    return response;
  },

  getMemberDocuments: async (
    spaceId: UUID,
    memberId: UUID,
  ): Promise<MemberDocumentResponse[]> => {
    console.log(`${LOG_TAG} GET /spaces/${spaceId}/members/${memberId}/documents`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MemberDocumentResponse[]>>(
        `/spaces/${spaceId}/members/${memberId}/documents`,
      ),
    );

    console.log(`${LOG_TAG} getMemberDocuments response`, response.length);
    return response;
  },

  deleteMemberDocument: async (
    spaceId: UUID,
    memberId: UUID,
    documentId: UUID,
  ): Promise<void> => {
    console.log(`${LOG_TAG} DELETE /spaces/${spaceId}/members/${memberId}/documents/${documentId}`);

    await unwrapVoidResponse(
      apiClient.delete(
        `/spaces/${spaceId}/members/${memberId}/documents/${documentId}`,
      ),
    );

    console.log(`${LOG_TAG} deleteMemberDocument success`);
  },

  addMemberNote: async (
    spaceId: UUID,
    memberId: UUID,
    body: CreateMemberNoteRequest,
  ): Promise<MemberNoteResponse> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/members/${memberId}/notes`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<MemberNoteResponse>>(
        `/spaces/${spaceId}/members/${memberId}/notes`,
        body,
      ),
    );

    console.log(`${LOG_TAG} addMemberNote response`, response.noteId);
    return response;
  },

  getMemberNotes: async (
    spaceId: UUID,
    memberId: UUID,
  ): Promise<MemberNoteResponse[]> => {
    console.log(`${LOG_TAG} GET /spaces/${spaceId}/members/${memberId}/notes`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MemberNoteResponse[]>>(
        `/spaces/${spaceId}/members/${memberId}/notes`,
      ),
    );

    console.log(`${LOG_TAG} getMemberNotes response`, response.length);
    return response;
  },

  getMemberHistory: async (
    spaceId: UUID,
    memberId: UUID,
  ): Promise<MemberHistoryResponse[]> => {
    console.log(`${LOG_TAG} GET /spaces/${spaceId}/members/${memberId}/history`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<MemberHistoryResponse[]>>(
        `/spaces/${spaceId}/members/${memberId}/history`,
      ),
    );

    console.log(`${LOG_TAG} getMemberHistory response`, response.length);
    return response;
  },

  createInvitation: async (
    body: CreateInvitationRequest,
  ): Promise<InvitationResponse> => {
    console.log(`${LOG_TAG} POST /invitations`, body.spaceId);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<InvitationResponse>>('/invitations', body),
    );

    console.log(`${LOG_TAG} createInvitation response`, response.id);
    return response;
  },

  acceptInvitation: async (
    invitationId: UUID,
    body: AcceptInvitationRequest,
  ): Promise<SpaceMembershipResponse> => {
    console.log(`${LOG_TAG} POST /invitations/${invitationId}/accept`);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceMembershipResponse>>(
        `/invitations/${invitationId}/accept`,
        body,
      ),
    );

    console.log(`${LOG_TAG} acceptInvitation response`, response.spaceId);
    return response;
  },

  cancelInvitation: async (invitationId: UUID): Promise<void> => {
    console.log(`${LOG_TAG} DELETE /invitations/${invitationId}`);

    await unwrapVoidResponse(
      apiClient.delete(`/invitations/${invitationId}`),
    );

    console.log(`${LOG_TAG} cancelInvitation success`);
  },

  getPendingInvitations: async (
    spaceId: UUID,
  ): Promise<PendingInvitationResponse[]> => {
    console.log(`${LOG_TAG} GET /spaces/${spaceId}/invitations`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PendingInvitationResponse[]>>(
        `/spaces/${spaceId}/invitations`,
      ),
    );

    console.log(`${LOG_TAG} getPendingInvitations response`, response.length);
    return response;
  },
};
