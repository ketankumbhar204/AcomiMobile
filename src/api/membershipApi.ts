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
import { devLog } from '../utils/devLog';

const LOG_TAG = '[MembershipApi]';

/** @deprecated Use memberApi — legacy wrapper during migration */
export const membershipApi = {
  createInvitation: (body: CreateInvitationRequest): Promise<InvitationResponse> => {
    devLog(`${LOG_TAG} delegate createInvitation`);
    return memberApi.createInvitation(body);
  },

  acceptInvitation: (
    invitationId: UUID,
    body: AcceptInvitationRequest,
  ): Promise<SpaceMembershipResponse> => {
    devLog(`${LOG_TAG} delegate acceptInvitation`);
    return memberApi.acceptInvitation(invitationId, body);
  },

  cancelInvitation: (invitationId: UUID): Promise<void> => {
    devLog(`${LOG_TAG} delegate cancelInvitation`);
    return memberApi.cancelInvitation(invitationId);
  },

  getMembers: (spaceId: UUID): Promise<MemberResponse[]> => {
    devLog(`${LOG_TAG} delegate getMembers`);
    return memberApi.getMembers(spaceId);
  },

  getPendingInvitations: (
    spaceId: UUID,
  ): Promise<PendingInvitationResponse[]> => {
    devLog(`${LOG_TAG} delegate getPendingInvitations`);
    return memberApi.getPendingInvitations(spaceId);
  },
};
