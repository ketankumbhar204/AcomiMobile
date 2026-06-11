import { memberApi } from './memberApi';
import type {
  AcceptInvitationRequest,
  CreateInvitationRequest,
  InvitationResponse,
  MemberResponse,
  PendingInvitationResponse,
  SpaceMembershipResponse,
  UUID,
} from './types';

const LOG_TAG = '[MembershipApi]';

/** @deprecated Use memberApi — legacy wrapper during migration */
export const membershipApi = {
  createInvitation: (body: CreateInvitationRequest): Promise<InvitationResponse> => {
    console.log(`${LOG_TAG} delegate createInvitation`);
    return memberApi.createInvitation(body);
  },

  acceptInvitation: (
    invitationId: UUID,
    body: AcceptInvitationRequest,
  ): Promise<SpaceMembershipResponse> => {
    console.log(`${LOG_TAG} delegate acceptInvitation`);
    return memberApi.acceptInvitation(invitationId, body);
  },

  cancelInvitation: (invitationId: UUID): Promise<void> => {
    console.log(`${LOG_TAG} delegate cancelInvitation`);
    return memberApi.cancelInvitation(invitationId);
  },

  getMembers: (spaceId: UUID): Promise<MemberResponse[]> => {
    console.log(`${LOG_TAG} delegate getMembers`);
    return memberApi.getMembers(spaceId);
  },

  getPendingInvitations: (
    spaceId: UUID,
  ): Promise<PendingInvitationResponse[]> => {
    console.log(`${LOG_TAG} delegate getPendingInvitations`);
    return memberApi.getPendingInvitations(spaceId);
  },
};
