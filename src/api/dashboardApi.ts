import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type {
  ApiResponse,
  DashboardSummaryResponse,
  GlobalDashboardResponse,
  MemberPaymentLedgerResponse,
  SpaceType,
  UUID,
} from './types';
import { ApiError } from './types';
import {
  buildDashboardSummaryFallback,
  buildMemberPaymentLedgerFallback,
} from '../utils/dashboardSummaryFallback';
import { currentMonthKey } from '../utils/dashboardFinancial';
import {
  normalizeDashboardSummary,
  normalizePaymentLedger,
} from '../utils/normalizeDashboardSummary';

const LOG_TAG = '[DashboardApi]';

function shouldUseFallback(error: unknown): boolean {
  // Only fall back when the endpoint is missing (older backends).
  // Never fall back on network/timeout — that triggers N× building-summary COUNT storms
  // while the connection pool is already saturated.
  if (error instanceof ApiError) {
    return error.status === 404;
  }
  return false;
}

function shouldUseLedgerFallback(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 404;
  }
  return false;
}

export const dashboardApi = {
  getDashboardSummary: async (
    spaceId: UUID,
    spaceType: SpaceType,
    month = currentMonthKey(),
  ): Promise<DashboardSummaryResponse> => {
    const path = `/spaces/${spaceId}/dashboard-summary?month=${month}`;
    console.log(`${LOG_TAG} GET ${path}`);

    try {
      const response = await unwrapApiResponse(
        apiClient.get<ApiResponse<DashboardSummaryResponse>>(path),
      );
      return normalizeDashboardSummary(response);
    } catch (error) {
      if (!shouldUseFallback(error)) {
        throw error;
      }
      console.log(`${LOG_TAG} dashboard-summary unavailable, using client fallback`, error);
      return buildDashboardSummaryFallback(spaceId, spaceType, month);
    }
  },

  getMemberPaymentLedger: async (
    spaceId: UUID,
    spaceType: SpaceType,
    month = currentMonthKey(),
  ): Promise<MemberPaymentLedgerResponse> => {
    const path = `/spaces/${spaceId}/payments/ledger?month=${month}`;
    console.log(`${LOG_TAG} GET ${path}`);

    try {
      const response = await unwrapApiResponse(
        apiClient.get<ApiResponse<MemberPaymentLedgerResponse>>(path),
      );
      return normalizePaymentLedger(response);
    } catch (error) {
      if (!shouldUseLedgerFallback(error)) {
        throw error;
      }
      console.log(`${LOG_TAG} payments ledger unavailable, using client fallback`, error);
      return buildMemberPaymentLedgerFallback(spaceId, spaceType, month);
    }
  },

  getGlobalDashboard: async (
    month = currentMonthKey(),
    sync = true,
  ): Promise<GlobalDashboardResponse> => {
    const path = `/dashboard/global?month=${encodeURIComponent(month)}&sync=${sync}`;
    console.log(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(apiClient.get<ApiResponse<GlobalDashboardResponse>>(path));
  },
};
