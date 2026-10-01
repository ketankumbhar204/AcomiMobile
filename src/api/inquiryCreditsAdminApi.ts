import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type { ApiResponse, PagedResponse, UUID } from './types';
import type {
  InquiryCreditPackage,
  InquiryCreditPurchaseResponse,
  InquiryCreditPurchaseStatus,
  InquiryCreditsPaymentConfig,
} from './inquiryCreditsApi';

export type AdminInquiryPurchaseSummary = {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
};

export type AdminInquiryPurchaseRow = InquiryCreditPurchaseResponse & {
  userFullName?: string | null;
  userMobileNumber?: string | null;
};

export type UpdateInquiryPaymentConfigRequest = {
  enabled?: boolean;
  upiId?: string | null;
  whatsappNumber?: string | null;
  qrFileId?: string | null;
  instructions?: string | null;
  webFreeDailyLimit?: number;
  androidBillingMode?: 'FREE' | 'CREDITS';
  androidFreeDailyLimit?: number;
  androidHourlyRateLimit?: number;
};

export type UpdateInquiryPackageRequest = {
  name?: string;
  priceAmount?: number;
  credits?: number;
  enabled?: boolean;
};

const BASE = '/admin/inquiry-credits';

export const inquiryCreditsAdminApi = {
  getPaymentConfig: (): Promise<InquiryCreditsPaymentConfig> =>
    unwrapApiResponse(apiClient.get<ApiResponse<InquiryCreditsPaymentConfig>>(`${BASE}/payment-config`)),

  updatePaymentConfig: (
    body: UpdateInquiryPaymentConfigRequest,
  ): Promise<InquiryCreditsPaymentConfig> =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<InquiryCreditsPaymentConfig>>(`${BASE}/payment-config`, body),
    ),

  listPackages: (): Promise<InquiryCreditPackage[]> =>
    unwrapApiResponse(apiClient.get<ApiResponse<InquiryCreditPackage[]>>(`${BASE}/packages`)),

  updatePackage: (id: UUID, body: UpdateInquiryPackageRequest): Promise<InquiryCreditPackage> =>
    unwrapApiResponse(
      apiClient.put<ApiResponse<InquiryCreditPackage>>(`${BASE}/packages/${id}`, body),
    ),

  getPurchasesSummary: (): Promise<AdminInquiryPurchaseSummary> =>
    unwrapApiResponse(apiClient.get<ApiResponse<AdminInquiryPurchaseSummary>>(`${BASE}/summary`)),

  listPurchases: (params?: {
    status?: InquiryCreditPurchaseStatus | '';
    page?: number;
    size?: number;
  }): Promise<PagedResponse<AdminInquiryPurchaseRow>> =>
    unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<AdminInquiryPurchaseRow>>>(`${BASE}/purchase-requests`, {
        params,
      }),
    ),

  approvePurchase: (purchaseId: UUID): Promise<AdminInquiryPurchaseRow> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AdminInquiryPurchaseRow>>(
        `${BASE}/purchase-requests/${purchaseId}/approve`,
      ),
    ),

  rejectPurchase: (purchaseId: UUID, reason?: string): Promise<AdminInquiryPurchaseRow> =>
    unwrapApiResponse(
      apiClient.post<ApiResponse<AdminInquiryPurchaseRow>>(
        `${BASE}/purchase-requests/${purchaseId}/reject`,
        { reason },
      ),
    ),
};
