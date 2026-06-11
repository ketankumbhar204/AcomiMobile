import { memberApi } from './memberApi';
import {
  AcceptInvitationRequest,
  CreateInvitationRequest,
  InvitationResponse,
  SpaceMembershipResponse,
  UUID,
} from './types';

/** @deprecated Use memberApi */
export const invitationApi = {
  create: (payload: CreateInvitationRequest): Promise<InvitationResponse> =>
    memberApi.createInvitation(payload),

  accept: (
    invitationId: UUID,
    payload: AcceptInvitationRequest,
  ): Promise<SpaceMembershipResponse> =>
    memberApi.acceptInvitation(invitationId, payload),
};
