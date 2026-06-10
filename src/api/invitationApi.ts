import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import {
  AcceptInvitationRequest,
  ApiResponse,
  CreateInvitationRequest,
  InvitationResponse,
  SpaceMembershipResponse,
  UUID,
} from './types';

export const invitationApi = {
  create: async (
    payload: CreateInvitationRequest,
  ): Promise<InvitationResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<InvitationResponse>>('/invitations', payload),
    );
  },

  accept: async (
    invitationId: UUID,
    payload: AcceptInvitationRequest,
  ): Promise<SpaceMembershipResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<SpaceMembershipResponse>>(
        `/invitations/${invitationId}/accept`,
        payload,
      ),
    );
  },
};
