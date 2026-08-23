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
import { buildMemberPaymentLedgerFallback } from '../utils/dashboardSummaryFallback';
import { currentMonthKey } from '../utils/dashboardFinancial';
import {
  normalizeDashboardSummary,
  normalizePaymentLedger,
} from '../utils/normalizeDashboardSummary';
import { devLog } from '../utils/devLog';

const LOG_TAG = '[DashboardApi]';

/** Align with payments summary timeout when cold snapshot ensure runs once. */
const DASHBOARD_SUMMARY_TIMEOUT_MS = 120_000;

/** Global sync walks every owned space — can exceed the default 30s client timeout. */
const GLOBAL_DASHBOARD_TIMEOUT_MS = 120_000;

function shouldUseLedgerFallback(error: unknown): boolean {
  if (error instanceof ApiError) {
    // Match docs: fall back on missing endpoint (404) or transport failure (timeout / offline).
    return error.status === 404 || error.isNetworkError;
  }
  return false;
}

export const dashboardApi = {
  getDashboardSummary: async (
    spaceId: UUID,
    _spaceType: SpaceType,
    month = currentMonthKey(),
  ): Promise<DashboardSummaryResponse> => {
    const path = `/spaces/${spaceId}/dashboard-summary?month=${month}`;
    devLog(`${LOG_TAG} GET ${path}`);
    // Pending Actions is the Action Center SoT — no client-side attention fallback.
    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<DashboardSummaryResponse>>(path, {
        timeout: DASHBOARD_SUMMARY_TIMEOUT_MS,
      }),
    );
    return normalizeDashboardSummary(response);
  },

  getMemberPaymentLedger: async (
    spaceId: UUID,
    spaceType: SpaceType,
    month = currentMonthKey(),
  ): Promise<MemberPaymentLedgerResponse> => {
    const path = `/spaces/${spaceId}/payments/ledger?month=${month}`;
    devLog(`${LOG_TAG} GET ${path}`);

    try {
      const response = await unwrapApiResponse(
        apiClient.get<ApiResponse<MemberPaymentLedgerResponse>>(path),
      );
      return normalizePaymentLedger(response);
    } catch (error) {
      if (!shouldUseLedgerFallback(error)) {
        throw error;
      }
      devLog(`${LOG_TAG} payments ledger unavailable, using client fallback`, error);
      return buildMemberPaymentLedgerFallback(spaceId, spaceType, month);
    }
  },

  getGlobalDashboard: async (
    month = currentMonthKey(),
    sync = true,
  ): Promise<GlobalDashboardResponse> => {
    const path = `/dashboard/global?month=${encodeURIComponent(month)}&sync=${sync}`;
    devLog(`${LOG_TAG} GET ${path}`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<GlobalDashboardResponse>>(path, {
        timeout: GLOBAL_DASHBOARD_TIMEOUT_MS,
      }),
    );
  },
};
