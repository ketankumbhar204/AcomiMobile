import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type {
  AllocateOccupancyRequest,
  ApiResponse,
  MemberOccupancyListResponse,
  OccupancyListFilters,
  OccupancyResponse,
  PagedResponse,
  TransferOccupancyRequest,
  UUID,
  VacateOccupancyRequest,
} from './types';

const LOG_TAG = '[OccupancyApi]';

function buildOccupancyListQuery(filters?: OccupancyListFilters): string {
  if (!filters) {
    return '';
  }
  const q = new URLSearchParams();
  if (filters.status) {
    q.set('status', filters.status);
  }
  if (filters.memberId) {
    q.set('memberId', filters.memberId);
  }
  if (filters.buildingId) {
    q.set('buildingId', filters.buildingId);
  }
  if (filters.floorId) {
    q.set('floorId', filters.floorId);
  }
  if (filters.unitId) {
    q.set('unitId', filters.unitId);
  }
  if (filters.roomId) {
    q.set('roomId', filters.roomId);
  }
  if (filters.bedId) {
    q.set('bedId', filters.bedId);
  }
  if (filters.targetType) {
    q.set('targetType', filters.targetType);
  }
  if (filters.page != null) {
    q.set('page', String(filters.page));
  }
  if (filters.size != null) {
    q.set('size', String(filters.size));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const occupancyApi = {
  allocateMember: async (
    spaceId: UUID,
    body: AllocateOccupancyRequest,
  ): Promise<OccupancyResponse> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/occupancies`, body);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<OccupancyResponse>>(
        `/spaces/${spaceId}/occupancies`,
        body,
      ),
    );
  },

  transferOccupancy: async (
    spaceId: UUID,
    occupancyId: UUID,
    body: TransferOccupancyRequest,
  ): Promise<OccupancyResponse> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/occupancies/${occupancyId}/transfer`, body);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<OccupancyResponse>>(
        `/spaces/${spaceId}/occupancies/${occupancyId}/transfer`,
        body,
      ),
    );
  },

  vacateOccupancy: async (
    spaceId: UUID,
    occupancyId: UUID,
    body?: VacateOccupancyRequest,
  ): Promise<OccupancyResponse> => {
    console.log(`${LOG_TAG} POST /spaces/${spaceId}/occupancies/${occupancyId}/vacate`, body);
    return unwrapApiResponse(
      apiClient.post<ApiResponse<OccupancyResponse>>(
        `/spaces/${spaceId}/occupancies/${occupancyId}/vacate`,
        body ?? {},
      ),
    );
  },

  getOccupancy: async (spaceId: UUID, occupancyId: UUID): Promise<OccupancyResponse> => {
    console.log(`${LOG_TAG} GET /spaces/${spaceId}/occupancies/${occupancyId}`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<OccupancyResponse>>(
        `/spaces/${spaceId}/occupancies/${occupancyId}`,
      ),
    );
  },

  listOccupancies: async (
    spaceId: UUID,
    filters?: OccupancyListFilters,
  ): Promise<PagedResponse<OccupancyResponse>> => {
    const query = buildOccupancyListQuery(filters);
    console.log(`${LOG_TAG} GET /spaces/${spaceId}/occupancies${query}`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<OccupancyResponse>>>(
        `/spaces/${spaceId}/occupancies${query}`,
      ),
    );
  },

  getMemberOccupancies: async (
    spaceId: UUID,
    memberId: UUID,
  ): Promise<MemberOccupancyListResponse> => {
    console.log(`${LOG_TAG} GET /spaces/${spaceId}/members/${memberId}/occupancies`);
    return unwrapApiResponse(
      apiClient.get<ApiResponse<MemberOccupancyListResponse>>(
        `/spaces/${spaceId}/members/${memberId}/occupancies`,
      ),
    );
  },
};
