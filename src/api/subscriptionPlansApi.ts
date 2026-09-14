import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type {
  ApiResponse,
  CreateSubscriptionActivationRequest,
  CreateSubscriptionPlanRequest,
  CustomerSubscriptionStatusResponse,
  SubscriptionActivationRequestResponse,
  SubscriptionPlanResponse,
  UpdateSubscriptionPlanRequest,
  UUID,
} from './types';
import { ensureUploadedFileId } from '../services/fileUploadService';
import type { LocalFileInput } from '../services/fileUploadService';

export const subscriptionPlansApi = {
  listPlans: async (
    spaceId: UUID,
    options?: { includeInactive?: boolean },
  ): Promise<SubscriptionPlanResponse[]> => {
    const query = options?.includeInactive ? '?includeInactive=true' : '';
    return unwrapApiResponse(
      apiClient.get<ApiResponse<SubscriptionPlanResponse[]>>(
        `/spaces/${spaceId}/subscription-plans${query}`,
      ),
    );
  },

  createPlan: async (
    spaceId: UUID,
    payload: CreateSubscriptionPlanRequest,
  ): Promise<SubscriptionPlanResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<SubscriptionPlanResponse>>(
        `/spaces/${spaceId}/subscription-plans`,
        payload,
      ),
    );
  },

  updatePlan: async (
    spaceId: UUID,
    planId: UUID,
    payload: UpdateSubscriptionPlanRequest,
  ): Promise<SubscriptionPlanResponse> => {
    return unwrapApiResponse(
      apiClient.put<ApiResponse<SubscriptionPlanResponse>>(
        `/spaces/${spaceId}/subscription-plans/${planId}`,
        payload,
      ),
    );
  },

  deactivatePlan: async (spaceId: UUID, planId: UUID): Promise<void> => {
    await apiClient.post(`/spaces/${spaceId}/subscription-plans/${planId}/deactivate`);
  },

  getCustomerStatus: async (
    spaceId: UUID,
    memberId: UUID,
  ): Promise<CustomerSubscriptionStatusResponse> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<CustomerSubscriptionStatusResponse>>(
        `/spaces/${spaceId}/members/${memberId}/subscription-status`,
      ),
    );
  },

  getMyCustomerStatus: async (spaceId: UUID): Promise<CustomerSubscriptionStatusResponse> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<CustomerSubscriptionStatusResponse>>(
        `/spaces/${spaceId}/members/me/subscription-status`,
      ),
    );
  },

  listPendingRequests: async (spaceId: UUID): Promise<SubscriptionActivationRequestResponse[]> => {
    return unwrapApiResponse(
      apiClient.get<ApiResponse<SubscriptionActivationRequestResponse[]>>(
        `/spaces/${spaceId}/subscription-activation-requests/pending`,
      ),
    );
  },

  createActivationRequest: async (
    spaceId: UUID,
    memberId: UUID,
    payload: CreateSubscriptionActivationRequest & { localFile?: LocalFileInput },
  ): Promise<SubscriptionActivationRequestResponse> => {
    const proofFileId = await ensureUploadedFileId(payload.proofFileId, payload.localFile, {
      purpose: 'SUBSCRIPTION_PAYMENT_PROOF',
      spaceId,
      memberId,
    });
    const { localFile: _ignored, ...rest } = payload;
    return unwrapApiResponse(
      apiClient.post<ApiResponse<SubscriptionActivationRequestResponse>>(
        `/spaces/${spaceId}/members/${memberId}/subscription-activation-requests`,
        { ...rest, proofFileId },
      ),
    );
  },

  approveActivationRequest: async (
    spaceId: UUID,
    requestId: UUID,
    ownerNotes?: string,
  ): Promise<SubscriptionActivationRequestResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<SubscriptionActivationRequestResponse>>(
        `/spaces/${spaceId}/subscription-activation-requests/${requestId}/approve`,
        ownerNotes ? { ownerNotes } : {},
      ),
    );
  },

  rejectActivationRequest: async (
    spaceId: UUID,
    requestId: UUID,
    ownerNotes?: string,
  ): Promise<SubscriptionActivationRequestResponse> => {
    return unwrapApiResponse(
      apiClient.post<ApiResponse<SubscriptionActivationRequestResponse>>(
        `/spaces/${spaceId}/subscription-activation-requests/${requestId}/reject`,
        ownerNotes ? { ownerNotes } : {},
      ),
    );
  },
};
