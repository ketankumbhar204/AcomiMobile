import apiClient from './client';
import {
  AcceptInvitationRequest,
  CreateInvitationRequest,
  Invitation,
  UUID,
} from './types';

export const invitationApi = {
  create: async (payload: CreateInvitationRequest): Promise<Invitation> => {
    const { data } = await apiClient.post<Invitation>('/invitations', payload);
    return data;
  },

  accept: async (
    invitationId: UUID,
    payload: AcceptInvitationRequest,
  ): Promise<Invitation> => {
    const { data } = await apiClient.post<Invitation>(
      `/invitations/${invitationId}/accept`,
      payload,
    );
    return data;
  },
};
