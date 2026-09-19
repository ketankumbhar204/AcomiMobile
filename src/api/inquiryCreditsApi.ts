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
  androidBillingMode?: 'FREE' | 'CREDITS';
  androidFreeDailyLimit?: number;
  androidHourlyRateLimit?: number;
  packages: InquiryCreditPackage[];
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
