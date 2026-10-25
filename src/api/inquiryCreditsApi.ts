/**
 * Inquiry Credits — wallet, payment-config and purchase APIs.
 *
 * Backend endpoints (all authenticated, X-ACOMI-CLIENT: ANDROID added by client):
 *   GET  /inquiry-credits/wallet
 *   GET  /inquiry-credits/payment-config
 *   POST /inquiry-credits/purchase-requests
 *   GET  /inquiry-credits/purchase-requests/me
 *
 * Field names match backend Jackson DTOs (InquiryWalletResponse,
 * InquiryPaymentConfigResponse, InquiryCreditPackageResponse,
 * InquiryCreditPurchaseRequestResponse).
 */

import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type { ApiResponse, UUID } from './types';

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface InquiryCreditsWallet {
  walletId: UUID;
  userId: UUID;
  availableCredits: number;
  lifetimeGranted: number;
  lifetimeUsed: number;
  updatedAt?: string | null;
}

export interface InquiryCreditPackage {
  id: UUID;
  name: string;
  priceAmount: number;
  currency: string;
  credits: number;
  enabled: boolean;
  displayOrder: number;
  clientChannel?: 'WEB' | 'ANDROID';
}

export interface InquiryCreditsPaymentConfig {
  configId?: UUID;
  /** When false the purchase UI should be hidden. */
  enabled: boolean;
  upiId?: string | null;
  qrFileId?: UUID | null;
  /** Pre-signed URL for the UPI QR image. */
  qrUrl?: string | null;
  whatsappNumber?: string | null;
  instructions?: string | null;
  webFreeDailyLimit?: number;
  viewHereDailyLimit?: number;
  webViewHereEnabled?: boolean;
  androidViewHereEnabled?: boolean;
  androidViewHereDailyLimit?: number;
  androidBillingMode?: 'FREE' | 'CREDITS';
  androidFreeDailyLimit?: number;
  androidHourlyRateLimit?: number;
  packages: InquiryCreditPackage[];
}

export type InquiryQuota = {
  channel?: string;
  dailyFreeLimit: number;
  freeUsedToday: number;
  freeRemainingToday: number;
  availableCredits: number;
  androidBillingMode?: 'FREE' | 'CREDITS' | string | null;
  purchasesEnabled?: boolean;
  unlimited?: boolean;
  viewHereDailyLimit?: number;
  viewHereUsedToday?: number;
  viewHereRemainingToday?: number;
};

export function isUnlimitedQuota(quota: InquiryQuota | null | undefined): boolean {
  if (!quota) return false;
  return quota.unlimited === true || quota.purchasesEnabled === false;
}

/** Paid wallet credits. Not the daily free allowance. Missing quota is zero, not unlimited. */
export function paidCreditsOf(quota: InquiryQuota | null | undefined): number {
  const credits = Number(quota?.availableCredits ?? 0);
  return Number.isFinite(credits) && credits > 0 ? credits : 0;
}

export function canSendEmailEnquiry(quota: InquiryQuota | null | undefined): boolean {
  if (!quota || isUnlimitedQuota(quota)) return true;
  return Number(quota.freeRemainingToday) > 0 || paidCreditsOf(quota) > 0;
}

export function needsInquiryPayment(quota: InquiryQuota | null | undefined): boolean {
  return quota != null && !isUnlimitedQuota(quota) && !canSendEmailEnquiry(quota);
}

/** Method flags for the contact chooser. Safe while quota is still loading. */
export function inquiryMethodAvailability(quota: InquiryQuota | null | undefined): {
  dailyLimit: number;
  remainingKnown: boolean;
  remainingToday: number;
  paidLeft: number;
  emailExhausted: boolean;
  viewHereLimit: number;
  viewHereRemaining: number;
  showViewHere: boolean;
  showViewHereExhausted: boolean;
} {
  const dailyLimit = quota?.dailyFreeLimit ?? 0;
  const remainingKnown = quota != null && !isUnlimitedQuota(quota);
  const remainingToday = quota?.freeRemainingToday ?? dailyLimit;
  const paidLeft = paidCreditsOf(quota);
  const emailExhausted = needsInquiryPayment(quota);
  const viewHereLimit = quota?.viewHereDailyLimit ?? 0;
  const viewHereRemaining = quota?.viewHereRemainingToday ?? 0;
  return {
    dailyLimit,
    remainingKnown,
    remainingToday,
    paidLeft,
    emailExhausted,
    viewHereLimit,
    viewHereRemaining,
    showViewHere: viewHereLimit > 0 && viewHereRemaining > 0,
    showViewHereExhausted: viewHereLimit > 0 && viewHereRemaining <= 0,
  };
}

/** What the listing screen should do before showing the contact chooser. */
export function directContactDecision(
  quota: InquiryQuota | null | undefined,
): 'reveal' | 'exhausted' | 'disabled' {
  const limit = quota?.viewHereDailyLimit ?? 0;
  const remaining = quota?.viewHereRemainingToday ?? 0;
  if (limit > 0 && remaining > 0) return 'reveal';
  if (limit > 0) return 'exhausted';
  return 'disabled';
}

export type InquiryCreditPurchaseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SubmitInquiryCreditPurchaseRequest {
  packageId: UUID;
  /** Optional UTR / transaction reference. */
  utr?: string;
}

export interface InquiryCreditPurchaseResponse {
  id: UUID;
  userId: UUID;
  packageId: UUID;
  amount: number;
  currency: string;
  credits: number;
  paymentMethod?: string | null;
  status: InquiryCreditPurchaseStatus;
  utr?: string | null;
  requestedAt: string;
  verifiedAt?: string | null;
  verifiedByUserId?: UUID | null;
  rejectionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const inquiryCreditsApi = {
  getWallet: (): Promise<InquiryCreditsWallet> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<InquiryCreditsWallet>>('/inquiry-credits/wallet'),
    ),

  getPaymentConfig: (): Promise<InquiryCreditsPaymentConfig> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<InquiryCreditsPaymentConfig>>(
        '/inquiry-credits/payment-config',
      ),
    ),

  getQuota: (): Promise<InquiryQuota> =>
    unwrapApiResponse(apiClient.get<ApiResponse<InquiryQuota>>('/inquiry-credits/quota')),

  submitPurchase: (
    payload: SubmitInquiryCreditPurchaseRequest,
  ): Promise<InquiryCreditPurchaseResponse> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<InquiryCreditPurchaseResponse>>(
        '/inquiry-credits/purchase-requests',
        payload,
      ),
    ),

  listMyPurchases: (): Promise<InquiryCreditPurchaseResponse[]> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<InquiryCreditPurchaseResponse[]>>(
        '/inquiry-credits/purchase-requests/me',
      ),
    ),
};
