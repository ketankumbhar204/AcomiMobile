import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type {
  ApiResponse,
  ListSpacePaymentsParams,
  OwnerPaymentsMonthResponse,
  PaymentTimelineResponse,
  PaymentsCardsPageResponse,
  PaymentsMembersPageResponse,
  PaymentsReviewQueueParam,
  PaymentsSummaryResponse,
  ReviewPaymentRequest,
  SpacePaymentListResponse,
  SpacePaymentResponse,
  SpaceType,
  SubmitPaymentProofRequest,
  UUID,
} from './types';
import { ApiError } from './types';
import { dashboardApi } from './dashboardApi';
import { computeOwnerPaymentCounts } from '../utils/ownerPaymentFilters';
import { normalizePaymentLedger } from '../utils/normalizeDashboardSummary';
import { devLog } from '../utils/devLog';
import { ensureUploadedFileId } from '../services/fileUploadService';
import type { LocalFileInput } from '../services/fileUploadService';

const LOG_TAG = '[PaymentsApi]';

/** Owner-month / summary can be heavy on cold Mess rebuild; use extended client timeout. */
const OWNER_MONTH_TIMEOUT_MS = 120_000;

export class PaymentServiceUnavailableError extends Error {
  readonly name = 'PaymentServiceUnavailableError';

  constructor(message = 'Payment service not available') {
    super(message);
  }
}

function isEndpointMissing(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

/** True only when the payments feature/endpoint is missing — not transient network failures. */
function isServiceUnavailable(error: unknown): boolean {
  return isEndpointMissing(error);
}

function rethrowUnlessUnavailable(error: unknown): never {
  if (isServiceUnavailable(error)) {
    throw new PaymentServiceUnavailableError();
  }
  throw error;
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
  if (params.sync === false) {
    parts.push('sync=false');
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

/** Deduplicate concurrent owner-month loads for the same space/month/sync. */
const ownerMonthInflight = new Map<string, Promise<OwnerPaymentsMonthResponse>>();

export const paymentsApi = {
  listPayments: async (
    spaceId: UUID,
    params?: ListSpacePaymentsParams,
  ): Promise<SpacePaymentListResponse> => {
    const query = buildQuery(params);
    const path = `/spaces/${spaceId}/payments${query}`;
    devLog(`${LOG_TAG} GET ${path}`);

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
    devLog(`${LOG_TAG} GET ${path}`);

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
    body: SubmitPaymentProofRequest & { localFile?: LocalFileInput },
  ): Promise<SpacePaymentResponse> => {
    const path = `/spaces/${spaceId}/payments/${paymentId}/proof`;
    devLog(`${LOG_TAG} POST ${path}`);

    try {
      const proofFileId = await ensureUploadedFileId(body.proofFileId, body.localFile, {
        purpose: 'PAYMENT_PROOF',
        spaceId,
        paymentId,
      });
      const { localFile: _ignored, ...rest } = body;
      return await unwrapApiResponse(
        apiClient.post<ApiResponse<SpacePaymentResponse>>(path, {
          ...rest,
          proofFileId,
        }),
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
    devLog(`${LOG_TAG} POST ${path}`, body);

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
    devLog(`${LOG_TAG} GET ${path}`);

    try {
      return await unwrapApiResponse(
        apiClient.get<ApiResponse<PaymentTimelineResponse>>(path),
      );
    } catch (error) {
      rethrowUnlessUnavailable(error);
    }
  },

  getPaymentsSummary: async (
    spaceId: UUID,
    month: string,
  ): Promise<PaymentsSummaryResponse> => {
    const path = `/spaces/${spaceId}/payments/summary?month=${encodeURIComponent(month)}`;
    devLog(`${LOG_TAG} GET ${path}`);
    try {
      const response = await unwrapApiResponse(
        apiClient.get<ApiResponse<PaymentsSummaryResponse>>(path, {
          timeout: OWNER_MONTH_TIMEOUT_MS,
        }),
      );
      return {
        ...response,
        financial: normalizePaymentLedger({
          month: response.month,
          spaceType: response.spaceType,
          summary: response.financial,
          members: [],
        }).summary,
        counts: response.counts ?? {
          pendingReview: 0,
          submitted: 0,
          changesRequested: 0,
          paid: 0,
          rejected: 0,
          history: 0,
          pendingMembers: 0,
        },
      };
    } catch (error) {
      rethrowUnlessUnavailable(error);
    }
  },

  getPaymentsMembers: async (
    spaceId: UUID,
    params: {
      month: string;
      page?: number;
      size?: number;
      q?: string;
      status?: string;
      sort?: string;
    },
  ): Promise<PaymentsMembersPageResponse> => {
    const parts = [`month=${encodeURIComponent(params.month)}`];
    if (params.page != null) {
      parts.push(`page=${params.page}`);
    }
    if (params.size != null) {
      parts.push(`size=${params.size}`);
    }
    if (params.q) {
      parts.push(`q=${encodeURIComponent(params.q)}`);
    }
    if (params.status) {
      parts.push(`status=${encodeURIComponent(params.status)}`);
    }
    if (params.sort) {
      parts.push(`sort=${encodeURIComponent(params.sort)}`);
    }
    const path = `/spaces/${spaceId}/payments/members?${parts.join('&')}`;
    devLog(`${LOG_TAG} GET ${path}`);
    try {
      return await unwrapApiResponse(
        apiClient.get<ApiResponse<PaymentsMembersPageResponse>>(path, {
          timeout: OWNER_MONTH_TIMEOUT_MS,
        }),
      );
    } catch (error) {
      rethrowUnlessUnavailable(error);
    }
  },

  getPaymentsReview: async (
    spaceId: UUID,
    params: {
      month: string;
      queue?: PaymentsReviewQueueParam;
      page?: number;
      size?: number;
    },
  ): Promise<PaymentsCardsPageResponse> => {
    const parts = [`month=${encodeURIComponent(params.month)}`];
    if (params.queue) {
      parts.push(`queue=${encodeURIComponent(params.queue)}`);
    }
    if (params.page != null) {
      parts.push(`page=${params.page}`);
    }
    if (params.size != null) {
      parts.push(`size=${params.size}`);
    }
    const path = `/spaces/${spaceId}/payments/review?${parts.join('&')}`;
    devLog(`${LOG_TAG} GET ${path}`);
    try {
      return await unwrapApiResponse(
        apiClient.get<ApiResponse<PaymentsCardsPageResponse>>(path),
      );
    } catch (error) {
      rethrowUnlessUnavailable(error);
    }
  },

  getPaymentsHistory: async (
    spaceId: UUID,
    params: {
      month: string;
      queue?: PaymentsReviewQueueParam;
      page?: number;
      size?: number;
    },
  ): Promise<PaymentsCardsPageResponse> => {
    const parts = [`month=${encodeURIComponent(params.month)}`];
    if (params.queue) {
      parts.push(`queue=${encodeURIComponent(params.queue)}`);
    }
    if (params.page != null) {
      parts.push(`page=${params.page}`);
    }
    if (params.size != null) {
      parts.push(`size=${params.size}`);
    }
    const path = `/spaces/${spaceId}/payments/history?${parts.join('&')}`;
    devLog(`${LOG_TAG} GET ${path}`);
    try {
      return await unwrapApiResponse(
        apiClient.get<ApiResponse<PaymentsCardsPageResponse>>(path),
      );
    } catch (error) {
      rethrowUnlessUnavailable(error);
    }
  },

  /** Explicit write command — not used on default screen open. */
  syncPaymentsMonth: async (spaceId: UUID, month: string): Promise<void> => {
    const path = `/spaces/${spaceId}/payments/sync?month=${encodeURIComponent(month)}`;
    devLog(`${LOG_TAG} POST ${path}`);
    try {
      await unwrapApiResponse(apiClient.post<ApiResponse<Record<string, string>>>(path, {}));
    } catch (error) {
      rethrowUnlessUnavailable(error);
    }
  },

  /**
   * Legacy aggregate — prefer summary + members + review.
   * Default sync=false (read-only).
   */
  getOwnerPaymentsMonth: async (
    spaceId: UUID,
    spaceType: SpaceType,
    month: string,
    sync = false,
  ): Promise<OwnerPaymentsMonthResponse> => {
    const inflightKey = `${spaceId}|${month}|${sync ? '1' : '0'}`;
    const existing = ownerMonthInflight.get(inflightKey);
    if (existing) {
      devLog(`${LOG_TAG} owner-month join-in-flight ${inflightKey}`);
      return existing;
    }

    const syncQuery = sync ? '' : '&sync=false';
    const path = `/spaces/${spaceId}/payments/owner-month?month=${encodeURIComponent(month)}${syncQuery}`;
    devLog(`${LOG_TAG} GET ${path}`);

    const promise = (async (): Promise<OwnerPaymentsMonthResponse> => {
      try {
        const response = await unwrapApiResponse(
          apiClient.get<ApiResponse<OwnerPaymentsMonthResponse>>(path, {
            timeout: OWNER_MONTH_TIMEOUT_MS,
          }),
        );
        const ledger = normalizePaymentLedger({
          month: response.month,
          spaceType: response.spaceType,
          summary: response.summary,
          members: response.members,
        });
        return {
          ...response,
          summary: ledger.summary,
          members: ledger.members,
          counts:
            response.counts ??
            computeOwnerPaymentCounts(response.payments ?? [], ledger.members),
        };
      } catch (error) {
        // Only legacy-fallback when the new route literally does not exist.
        if (isEndpointMissing(error)) {
          devLog(`${LOG_TAG} owner-month 404 — coordinating ledger + list`);
          return paymentsApi.getOwnerPaymentsMonthLegacy(spaceId, spaceType, month, sync);
        }
        rethrowUnlessUnavailable(error);
      } finally {
        ownerMonthInflight.delete(inflightKey);
      }
    })();

    ownerMonthInflight.set(inflightKey, promise);
    return promise;
  },

  /** Coordinated dual-fetch used as fallback when /owner-month is not deployed. */
  getOwnerPaymentsMonthLegacy: async (
    spaceId: UUID,
    spaceType: SpaceType,
    month: string,
    sync = true,
  ): Promise<OwnerPaymentsMonthResponse> => {
    const [ledger, list] = await Promise.all([
      dashboardApi.getMemberPaymentLedger(spaceId, spaceType, month),
      paymentsApi.listPayments(spaceId, { month, sync: false }),
    ]);
    return {
      month: ledger.month,
      spaceType: ledger.spaceType ?? spaceType,
      summary: ledger.summary,
      members: ledger.members,
      payments: list.payments,
      counts: computeOwnerPaymentCounts(list.payments, ledger.members),
    };
  },

  getOverduePayments: async (
    spaceId: UUID,
    params?: {
      paymentType?: string;
      reminderEligibleOnly?: boolean;
      page?: number;
      size?: number;
    },
  ) => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/payments/overdue`, params);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<unknown>>(`/spaces/${spaceId}/payments/overdue`, {
        params,
      }),
    );
  },

  sendPaymentReminder: async (spaceId: UUID, paymentId: UUID) => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/payments/${paymentId}/reminders`);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<PaymentReminderDeliveryResult>>(
        `/spaces/${spaceId}/payments/${paymentId}/reminders`,
      ),
    );
  },

  processPaymentReminders: async (spaceId: UUID) => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/payments/reminders/process`);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<PaymentReminderProcessResult>>(
        `/spaces/${spaceId}/payments/reminders/process`,
      ),
    );
  },
};

export type PaymentReminderDeliveryResult = {
  deliveryId: string;
  paymentId: string;
  channel: string;
  deliveryStatus: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  businessDate?: string;
  providerMessageId?: string | null;
  failureReason?: string | null;
  failureCode?: string | null;
  providerConfigured: boolean;
  retryable?: boolean;
  sentAt?: string | null;
  lastAttemptAt?: string | null;
  attemptCount?: number;
};

export type PaymentReminderProcessResult = {
  businessDate: string;
  providerConfigured: boolean;
  providerMode?: string;
  candidatesFound: number;
  remindersCreated: number;
  remindersSkippedDuplicate: number;
  deliverySuccesses: number;
  deliveryFailures: number;
};

export { isServiceUnavailable as isPaymentServiceUnavailable };
