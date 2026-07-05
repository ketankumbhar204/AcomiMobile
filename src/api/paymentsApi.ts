import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type {
  ApiResponse,
  ListSpacePaymentsParams,
  PaymentTimelineResponse,
  ReviewPaymentRequest,
  SpacePaymentListResponse,
  SpacePaymentResponse,
  SubmitPaymentProofRequest,
  UUID,
} from './types';
import { ApiError } from './types';

const LOG_TAG = '[PaymentsApi]';

export class PaymentServiceUnavailableError extends Error {
  readonly name = 'PaymentServiceUnavailableError';

  constructor(message = 'Payment service not available') {
    super(message);
  }
}

function isServiceUnavailable(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 404 || error.isNetworkError;
  }
  return false;
}

function buildQuery(params?: ListSpacePaymentsParams): string {
  if (!params) {
    return '';
  }
  const parts: string[] = [];
  if (params.month) {
    parts.push(`month=${encodeURIComponent(params.month)}`);
  }
  if (params.status) {
    parts.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params.memberId) {
    parts.push(`memberId=${encodeURIComponent(params.memberId)}`);
  }
  if (params.paymentType) {
    parts.push(`paymentType=${encodeURIComponent(params.paymentType)}`);
  }
  if (params.paymentCategory) {
    parts.push(`paymentCategory=${encodeURIComponent(params.paymentCategory)}`);
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

function rethrowUnlessUnavailable(error: unknown): never {
  if (isServiceUnavailable(error)) {
    throw new PaymentServiceUnavailableError();
  }
  throw error;
}

export const paymentsApi = {
  listPayments: async (
    spaceId: UUID,
    params?: ListSpacePaymentsParams,
  ): Promise<SpacePaymentListResponse> => {
    const query = buildQuery(params);
    const path = `/spaces/${spaceId}/payments${query}`;
    console.log(`${LOG_TAG} GET ${path}`);

    try {
      return await unwrapApiResponse(
        apiClient.get<ApiResponse<SpacePaymentListResponse>>(path),
      );
    } catch (error) {
      rethrowUnlessUnavailable(error);
    }
  },

  getPayment: async (spaceId: UUID, paymentId: UUID): Promise<SpacePaymentResponse> => {
    const path = `/spaces/${spaceId}/payments/${paymentId}`;
    console.log(`${LOG_TAG} GET ${path}`);

    try {
      return await unwrapApiResponse(
        apiClient.get<ApiResponse<SpacePaymentResponse>>(path),
      );
    } catch (error) {
      rethrowUnlessUnavailable(error);
    }
  },

  submitProof: async (
    spaceId: UUID,
    paymentId: UUID,
    body: SubmitPaymentProofRequest,
  ): Promise<SpacePaymentResponse> => {
    const path = `/spaces/${spaceId}/payments/${paymentId}/proof`;
    console.log(`${LOG_TAG} POST ${path}`);

    try {
      return await unwrapApiResponse(
        apiClient.post<ApiResponse<SpacePaymentResponse>>(path, body),
      );
    } catch (error) {
      rethrowUnlessUnavailable(error);
    }
  },

  reviewPayment: async (
    spaceId: UUID,
    paymentId: UUID,
    body: ReviewPaymentRequest,
  ): Promise<SpacePaymentResponse> => {
    const path = `/spaces/${spaceId}/payments/${paymentId}/review`;
    console.log(`${LOG_TAG} POST ${path}`, body);

    try {
      return await unwrapApiResponse(
        apiClient.post<ApiResponse<SpacePaymentResponse>>(path, body),
      );
    } catch (error) {
      rethrowUnlessUnavailable(error);
    }
  },

  getPaymentTimeline: async (
    spaceId: UUID,
    paymentId: UUID,
  ): Promise<PaymentTimelineResponse> => {
    const path = `/spaces/${spaceId}/payments/${paymentId}/timeline`;
    console.log(`${LOG_TAG} GET ${path}`);

    try {
      return await unwrapApiResponse(
        apiClient.get<ApiResponse<PaymentTimelineResponse>>(path),
      );
    } catch (error) {
      rethrowUnlessUnavailable(error);
    }
  },
};

export { isServiceUnavailable as isPaymentServiceUnavailable };
