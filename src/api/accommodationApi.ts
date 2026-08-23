import { buildListQuery, DEFAULT_LIST_PAGE_SIZE } from './accommodationListQuery';
import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import {
  AccommodationSetupPreviewResponse,
  AccommodationSetupRequest,
  AccommodationSetupResultResponse,
  AllocationTargetSearchParams,
  AllocationTargetSearchResponse,
  ApiResponse,
  AccommodationStatus,
  BedListItemResponse,
  BedSpaceListItemResponse,
  BedResponse,
  BuildingResponse,
  BuildingSummaryResponse,
  BulkCreateBedsRequest,
  BulkCreateBedsResponse,
  BulkCreateRoomsRequest,
  BulkCreateRoomsResponse,
  BulkCreateUnitsRequest,
  BulkCreateUnitsResponse,
  CreateBedRequest,
  CreateBuildingRequest,
  CreateFloorRequest,
  CreateRoomRequest,
  CreateUnitRequest,
  DuplicateBuildingRequest,
  DuplicateBuildingResponse,
  DuplicateFloorRequest,
  DuplicateFloorResponse,
  DuplicateRoomRequest,
  DuplicateRoomResponse,
  FloorListItemResponse,
  FloorResponse,
  ListQueryParams,
  PagedResponse,
  RoomListItemResponse,
  RoomResponse,
  UnitListItemResponse,
  UnitResponse,
  UpdateBedRequest,
  UpdateBuildingRequest,
  UpdateFloorRequest,
  UpdateRoomRequest,
  UpdateUnitRequest,
  UUID,
} from './types';
import { devLog } from '../utils/devLog';

const LOG_TAG = '[AccommodationApi]';

export const accommodationApi = {
  createBuilding: async (
    spaceId: UUID,
    body: CreateBuildingRequest,
  ): Promise<BuildingResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/buildings`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<BuildingResponse>>(
        `/spaces/${spaceId}/buildings`,
        body,
      ),
    );

    devLog(`${LOG_TAG} createBuilding response`, response.buildingId);
    return response;
  },

  getBuildings: async (spaceId: UUID): Promise<BuildingResponse[]> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/buildings`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<BuildingResponse[]>>(
        `/spaces/${spaceId}/buildings`,
      ),
    );

    devLog(`${LOG_TAG} getBuildings response`, response.length);
    return response;
  },

  getBuilding: async (
    spaceId: UUID,
    buildingId: UUID,
  ): Promise<BuildingResponse> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/buildings/${buildingId}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<BuildingResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}`,
      ),
    );

    devLog(`${LOG_TAG} getBuilding response`, response.buildingId);
    return response;
  },

  updateBuilding: async (
    spaceId: UUID,
    buildingId: UUID,
    body: UpdateBuildingRequest,
  ): Promise<BuildingResponse> => {
    devLog(`${LOG_TAG} PUT /spaces/${spaceId}/buildings/${buildingId}`, body);

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<BuildingResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}`,
        body,
      ),
    );

    devLog(`${LOG_TAG} updateBuilding response`, response.buildingId);
    return response;
  },

  getFloorById: async (spaceId: UUID, floorId: UUID): Promise<FloorResponse> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/floors/${floorId}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<FloorResponse>>(
        `/spaces/${spaceId}/floors/${floorId}`,
      ),
    );

    devLog(`${LOG_TAG} getFloorById response`, response.floorId);
    return response;
  },

  createFloor: async (
    spaceId: UUID,
    buildingId: UUID,
    body: CreateFloorRequest,
  ): Promise<FloorResponse> => {
    devLog(
      `${LOG_TAG} POST /spaces/${spaceId}/buildings/${buildingId}/floors`,
      body,
    );

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<FloorResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/floors`,
        body,
      ),
    );

    devLog(`${LOG_TAG} createFloor response`, response.floorId);
    return response;
  },

  listFloors: async (
    spaceId: UUID,
    buildingId: UUID,
    params?: ListQueryParams,
  ): Promise<PagedResponse<FloorListItemResponse>> => {
    const query = buildListQuery({ view: 'summary', ...params });
    devLog(
      `${LOG_TAG} GET /spaces/${spaceId}/buildings/${buildingId}/floors${query}`,
    );

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<FloorListItemResponse>>>(
        `/spaces/${spaceId}/buildings/${buildingId}/floors${query}`,
      ),
    );

    devLog(`${LOG_TAG} listFloors response`, response.content.length);
    return response;
  },

  /** @deprecated Prefer listFloors with view=summary */
  getFloors: async (
    spaceId: UUID,
    buildingId: UUID,
  ): Promise<FloorResponse[]> => {
    const query = buildListQuery({ view: 'full' });
    devLog(
      `${LOG_TAG} GET /spaces/${spaceId}/buildings/${buildingId}/floors${query}`,
    );

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<FloorResponse[]>>(
        `/spaces/${spaceId}/buildings/${buildingId}/floors${query}`,
      ),
    );

    devLog(`${LOG_TAG} getFloors response`, response.length);
    return response;
  },

  getFloor: async (
    spaceId: UUID,
    buildingId: UUID,
    floorId: UUID,
  ): Promise<FloorResponse> => {
    devLog(
      `${LOG_TAG} GET /spaces/${spaceId}/buildings/${buildingId}/floors/${floorId}`,
    );

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<FloorResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/floors/${floorId}`,
      ),
    );

    devLog(`${LOG_TAG} getFloor response`, response.floorId);
    return response;
  },

  updateFloor: async (
    spaceId: UUID,
    buildingId: UUID,
    floorId: UUID,
    body: UpdateFloorRequest,
  ): Promise<FloorResponse> => {
    devLog(
      `${LOG_TAG} PUT /spaces/${spaceId}/buildings/${buildingId}/floors/${floorId}`,
      body,
    );

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<FloorResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/floors/${floorId}`,
        body,
      ),
    );

    devLog(`${LOG_TAG} updateFloor response`, response.floorId);
    return response;
  },

  getUnitById: async (spaceId: UUID, unitId: UUID): Promise<UnitResponse> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/units/${unitId}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<UnitResponse>>(
        `/spaces/${spaceId}/units/${unitId}`,
      ),
    );

    devLog(`${LOG_TAG} getUnitById response`, response.unitId);
    return response;
  },

  createUnit: async (
    spaceId: UUID,
    buildingId: UUID,
    body: CreateUnitRequest,
  ): Promise<UnitResponse> => {
    devLog(
      `${LOG_TAG} POST /spaces/${spaceId}/buildings/${buildingId}/units`,
      body,
    );

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<UnitResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/units`,
        body,
      ),
    );

    devLog(`${LOG_TAG} createUnit response`, response.unitId);
    return response;
  },

  listUnits: async (
    spaceId: UUID,
    buildingId: UUID,
    params?: ListQueryParams,
  ): Promise<PagedResponse<UnitListItemResponse>> => {
    const query = buildListQuery({
      view: 'summary',
      includeSynthetic: false,
      ...params,
    });
    devLog(
      `${LOG_TAG} GET /spaces/${spaceId}/buildings/${buildingId}/units${query}`,
    );

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<UnitListItemResponse>>>(
        `/spaces/${spaceId}/buildings/${buildingId}/units${query}`,
      ),
    );

    devLog(`${LOG_TAG} listUnits response`, response.content.length);
    return response;
  },

  /** @deprecated Prefer listUnits with view=summary */
  getUnits: async (
    spaceId: UUID,
    buildingId: UUID,
  ): Promise<UnitResponse[]> => {
    const query = buildListQuery({ view: 'full' });
    devLog(
      `${LOG_TAG} GET /spaces/${spaceId}/buildings/${buildingId}/units${query}`,
    );

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<UnitResponse[]>>(
        `/spaces/${spaceId}/buildings/${buildingId}/units${query}`,
      ),
    );

    devLog(`${LOG_TAG} getUnits response`, response.length);
    return response;
  },

  listUnitsByFloor: async (
    spaceId: UUID,
    buildingId: UUID,
    floorId: UUID,
    params?: ListQueryParams,
  ): Promise<PagedResponse<UnitListItemResponse>> => {
    const query = buildListQuery({
      view: 'summary',
      includeSynthetic: false,
      ...params,
    });
    devLog(
      `${LOG_TAG} GET /spaces/${spaceId}/buildings/${buildingId}/floors/${floorId}/units${query}`,
    );

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<UnitListItemResponse>>>(
        `/spaces/${spaceId}/buildings/${buildingId}/floors/${floorId}/units${query}`,
      ),
    );

    devLog(`${LOG_TAG} listUnitsByFloor response`, response.content.length);
    return response;
  },

  createUnitOnFloor: async (
    spaceId: UUID,
    buildingId: UUID,
    floorId: UUID,
    body: CreateUnitRequest,
  ): Promise<UnitResponse> => {
    devLog(
      `${LOG_TAG} POST /spaces/${spaceId}/buildings/${buildingId}/floors/${floorId}/units`,
      body,
    );

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<UnitResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/floors/${floorId}/units`,
        body,
      ),
    );

    devLog(`${LOG_TAG} createUnitOnFloor response`, response.unitId);
    return response;
  },

  updateUnitById: async (
    spaceId: UUID,
    unitId: UUID,
    body: UpdateUnitRequest,
  ): Promise<UnitResponse> => {
    devLog(`${LOG_TAG} PUT /spaces/${spaceId}/units/${unitId}`, body);

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<UnitResponse>>(
        `/spaces/${spaceId}/units/${unitId}`,
        body,
      ),
    );

    devLog(`${LOG_TAG} updateUnitById response`, response.unitId);
    return response;
  },

  getUnit: async (
    spaceId: UUID,
    buildingId: UUID,
    unitId: UUID,
  ): Promise<UnitResponse> => {
    devLog(
      `${LOG_TAG} GET /spaces/${spaceId}/buildings/${buildingId}/units/${unitId}`,
    );

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<UnitResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/units/${unitId}`,
      ),
    );

    devLog(`${LOG_TAG} getUnit response`, response.unitId);
    return response;
  },

  updateUnit: async (
    spaceId: UUID,
    buildingId: UUID,
    unitId: UUID,
    body: UpdateUnitRequest,
  ): Promise<UnitResponse> => {
    devLog(
      `${LOG_TAG} PUT /spaces/${spaceId}/buildings/${buildingId}/units/${unitId}`,
      body,
    );

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<UnitResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/units/${unitId}`,
        body,
      ),
    );

    devLog(`${LOG_TAG} updateUnit response`, response.unitId);
    return response;
  },

  createRoomUnderFloor: async (
    spaceId: UUID,
    floorId: UUID,
    body: CreateRoomRequest,
  ): Promise<RoomResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/floors/${floorId}/rooms`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<RoomResponse>>(
        `/spaces/${spaceId}/floors/${floorId}/rooms`,
        body,
      ),
    );

    devLog(`${LOG_TAG} createRoomUnderFloor response`, response.roomId);
    return response;
  },

  createRoomUnderUnit: async (
    spaceId: UUID,
    unitId: UUID,
    body: CreateRoomRequest,
  ): Promise<RoomResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/units/${unitId}/rooms`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<RoomResponse>>(
        `/spaces/${spaceId}/units/${unitId}/rooms`,
        body,
      ),
    );

    devLog(`${LOG_TAG} createRoomUnderUnit response`, response.roomId);
    return response;
  },

  listRoomsByFloor: async (
    spaceId: UUID,
    floorId: UUID,
    params?: ListQueryParams,
  ): Promise<PagedResponse<RoomListItemResponse>> => {
    const query = buildListQuery({ view: 'summary', ...params });
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/floors/${floorId}/rooms${query}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<RoomListItemResponse>>>(
        `/spaces/${spaceId}/floors/${floorId}/rooms${query}`,
      ),
    );

    devLog(`${LOG_TAG} listRoomsByFloor response`, response.content.length);
    return response;
  },

  listRoomsByUnit: async (
    spaceId: UUID,
    unitId: UUID,
    params?: ListQueryParams,
  ): Promise<PagedResponse<RoomListItemResponse>> => {
    const query = buildListQuery({ view: 'summary', ...params });
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/units/${unitId}/rooms${query}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<RoomListItemResponse>>>(
        `/spaces/${spaceId}/units/${unitId}/rooms${query}`,
      ),
    );

    devLog(`${LOG_TAG} listRoomsByUnit response`, response.content.length);
    return response;
  },

  /** @deprecated Prefer listRoomsByFloor with view=summary */
  getRoomsByFloor: async (
    spaceId: UUID,
    floorId: UUID,
  ): Promise<RoomResponse[]> => {
    const query = buildListQuery({ view: 'full' });
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/floors/${floorId}/rooms${query}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<RoomResponse[]>>(
        `/spaces/${spaceId}/floors/${floorId}/rooms${query}`,
      ),
    );

    devLog(`${LOG_TAG} getRoomsByFloor response`, response.length);
    return response;
  },

  /** @deprecated Prefer listRoomsByUnit with view=summary */
  getRoomsByUnit: async (
    spaceId: UUID,
    unitId: UUID,
  ): Promise<RoomResponse[]> => {
    const query = buildListQuery({ view: 'full' });
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/units/${unitId}/rooms${query}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<RoomResponse[]>>(
        `/spaces/${spaceId}/units/${unitId}/rooms${query}`,
      ),
    );

    devLog(`${LOG_TAG} getRoomsByUnit response`, response.length);
    return response;
  },

  getRoom: async (spaceId: UUID, roomId: UUID): Promise<RoomResponse> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/rooms/${roomId}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<RoomResponse>>(
        `/spaces/${spaceId}/rooms/${roomId}`,
      ),
    );

    devLog(`${LOG_TAG} getRoom response`, response.roomId);
    return response;
  },

  updateRoom: async (
    spaceId: UUID,
    roomId: UUID,
    body: UpdateRoomRequest,
  ): Promise<RoomResponse> => {
    devLog(`${LOG_TAG} PUT /spaces/${spaceId}/rooms/${roomId}`, body);

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<RoomResponse>>(
        `/spaces/${spaceId}/rooms/${roomId}`,
        body,
      ),
    );

    devLog(`${LOG_TAG} updateRoom response`, response.roomId);
    return response;
  },

  createBed: async (
    spaceId: UUID,
    roomId: UUID,
    body: CreateBedRequest,
  ): Promise<BedResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/rooms/${roomId}/beds`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<BedResponse>>(
        `/spaces/${spaceId}/rooms/${roomId}/beds`,
        body,
      ),
    );

    devLog(`${LOG_TAG} createBed response`, response.bedId);
    return response;
  },

  listBeds: async (
    spaceId: UUID,
    roomId: UUID,
    params?: ListQueryParams,
  ): Promise<PagedResponse<BedListItemResponse>> => {
    const query = buildListQuery({ view: 'summary', ...params });
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/rooms/${roomId}/beds${query}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<BedListItemResponse>>>(
        `/spaces/${spaceId}/rooms/${roomId}/beds${query}`,
      ),
    );

    devLog(`${LOG_TAG} listBeds response`, response.content.length);
    return response;
  },

  /** @deprecated Prefer listBeds with view=summary */
  getBeds: async (spaceId: UUID, roomId: UUID): Promise<BedResponse[]> => {
    const query = buildListQuery({ view: 'full' });
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/rooms/${roomId}/beds${query}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<BedResponse[]>>(
        `/spaces/${spaceId}/rooms/${roomId}/beds${query}`,
      ),
    );

    devLog(`${LOG_TAG} getBeds response`, response.length);
    return response;
  },

  searchFloors: async (
    spaceId: UUID,
    query: string,
    params?: Omit<ListQueryParams, 'query'>,
  ): Promise<PagedResponse<FloorListItemResponse>> => {
    const qs = buildListQuery({
      view: 'summary',
      query,
      size: DEFAULT_LIST_PAGE_SIZE,
      ...params,
    });
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/floors${qs}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<FloorListItemResponse>>>(
        `/spaces/${spaceId}/floors${qs}`,
      ),
    );

    return response;
  },

  searchUnits: async (
    spaceId: UUID,
    query: string,
    params?: Omit<ListQueryParams, 'query'>,
  ): Promise<PagedResponse<UnitListItemResponse>> => {
    const qs = buildListQuery({
      view: 'summary',
      query,
      size: DEFAULT_LIST_PAGE_SIZE,
      ...params,
    });
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/units${qs}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<UnitListItemResponse>>>(
        `/spaces/${spaceId}/units${qs}`,
      ),
    );

    return response;
  },

  searchRooms: async (
    spaceId: UUID,
    query: string,
    params?: Omit<ListQueryParams, 'query'>,
  ): Promise<PagedResponse<RoomListItemResponse>> => {
    const qs = buildListQuery({
      view: 'summary',
      query,
      size: DEFAULT_LIST_PAGE_SIZE,
      ...params,
    });
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/rooms${qs}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<RoomListItemResponse>>>(
        `/spaces/${spaceId}/rooms${qs}`,
      ),
    );

    return response;
  },

  searchBeds: async (
    spaceId: UUID,
    params?: ListQueryParams & { status?: AccommodationStatus },
  ): Promise<PagedResponse<BedSpaceListItemResponse>> => {
    const qs = buildListQuery({
      view: 'summary',
      size: DEFAULT_LIST_PAGE_SIZE,
      ...params,
    });
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/beds${qs}`);

    return unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<BedSpaceListItemResponse>>>(
        `/spaces/${spaceId}/beds${qs}`,
      ),
    );
  },

  getBed: async (
    spaceId: UUID,
    roomId: UUID,
    bedId: UUID,
  ): Promise<BedResponse> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/rooms/${roomId}/beds/${bedId}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<BedResponse>>(
        `/spaces/${spaceId}/rooms/${roomId}/beds/${bedId}`,
      ),
    );

    devLog(`${LOG_TAG} getBed response`, response.bedId);
    return response;
  },

  updateBed: async (
    spaceId: UUID,
    roomId: UUID,
    bedId: UUID,
    body: UpdateBedRequest,
  ): Promise<BedResponse> => {
    devLog(
      `${LOG_TAG} PUT /spaces/${spaceId}/rooms/${roomId}/beds/${bedId}`,
      body,
    );

    const response = await unwrapApiResponse(
      apiClient.put<ApiResponse<BedResponse>>(
        `/spaces/${spaceId}/rooms/${roomId}/beds/${bedId}`,
        body,
      ),
    );

    devLog(`${LOG_TAG} updateBed response`, response.bedId);
    return response;
  },

  getBedById: async (spaceId: UUID, bedId: UUID): Promise<BedResponse> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/beds/${bedId}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<BedResponse>>(
        `/spaces/${spaceId}/beds/${bedId}`,
      ),
    );

    devLog(`${LOG_TAG} getBedById response`, response.bedId);
    return response;
  },

  previewSetup: async (
    spaceId: UUID,
    body: AccommodationSetupRequest,
  ): Promise<AccommodationSetupPreviewResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/accommodation/setup/preview`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<AccommodationSetupPreviewResponse>>(
        `/spaces/${spaceId}/accommodation/setup/preview`,
        body,
      ),
    );

    devLog(`${LOG_TAG} previewSetup response`, response.totals);
    return response;
  },

  executeSetup: async (
    spaceId: UUID,
    body: AccommodationSetupRequest,
    idempotencyKey: string,
  ): Promise<AccommodationSetupResultResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/accommodation/setup`, {
      idempotencyKey,
      body,
    });

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<AccommodationSetupResultResponse>>(
        `/spaces/${spaceId}/accommodation/setup`,
        body,
        { headers: { 'Idempotency-Key': idempotencyKey } },
      ),
    );

    devLog(`${LOG_TAG} executeSetup response`, response.buildingId);
    return response;
  },

  getBuildingSummary: async (
    spaceId: UUID,
    buildingId: UUID,
  ): Promise<BuildingSummaryResponse> => {
    devLog(`${LOG_TAG} GET /spaces/${spaceId}/buildings/${buildingId}/summary`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<BuildingSummaryResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/summary`,
      ),
    );

    devLog(`${LOG_TAG} getBuildingSummary response`, response.buildingId);
    return response;
  },

  duplicateBuilding: async (
    spaceId: UUID,
    buildingId: UUID,
    body: DuplicateBuildingRequest,
  ): Promise<DuplicateBuildingResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/buildings/${buildingId}/duplicate`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<DuplicateBuildingResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/duplicate`,
        body,
      ),
    );

    devLog(`${LOG_TAG} duplicateBuilding response`, response.buildingId);
    return response;
  },

  duplicateFloor: async (
    spaceId: UUID,
    buildingId: UUID,
    floorId: UUID,
    body: DuplicateFloorRequest,
  ): Promise<DuplicateFloorResponse> => {
    devLog(
      `${LOG_TAG} POST /spaces/${spaceId}/buildings/${buildingId}/floors/${floorId}/duplicate`,
      body,
    );

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<DuplicateFloorResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/floors/${floorId}/duplicate`,
        body,
      ),
    );

    devLog(`${LOG_TAG} duplicateFloor response`, response.floorId);
    return response;
  },

  duplicateRoom: async (
    spaceId: UUID,
    roomId: UUID,
    body: DuplicateRoomRequest,
  ): Promise<DuplicateRoomResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/rooms/${roomId}/duplicate`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<DuplicateRoomResponse>>(
        `/spaces/${spaceId}/rooms/${roomId}/duplicate`,
        body,
      ),
    );

    devLog(`${LOG_TAG} duplicateRoom response`, response.roomId);
    return response;
  },

  bulkCreateUnits: async (
    spaceId: UUID,
    buildingId: UUID,
    body: BulkCreateUnitsRequest,
  ): Promise<BulkCreateUnitsResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/buildings/${buildingId}/units/bulk`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<BulkCreateUnitsResponse>>(
        `/spaces/${spaceId}/buildings/${buildingId}/units/bulk`,
        body,
      ),
    );

    devLog(`${LOG_TAG} bulkCreateUnits response`, response.unitsCreated);
    return response;
  },

  bulkCreateRoomsUnderFloor: async (
    spaceId: UUID,
    floorId: UUID,
    body: BulkCreateRoomsRequest,
  ): Promise<BulkCreateRoomsResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/floors/${floorId}/rooms/bulk`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<BulkCreateRoomsResponse>>(
        `/spaces/${spaceId}/floors/${floorId}/rooms/bulk`,
        body,
      ),
    );

    devLog(`${LOG_TAG} bulkCreateRoomsUnderFloor response`, response.roomsCreated);
    return response;
  },

  bulkCreateRoomsUnderUnit: async (
    spaceId: UUID,
    unitId: UUID,
    body: BulkCreateRoomsRequest,
  ): Promise<BulkCreateRoomsResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/units/${unitId}/rooms/bulk`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<BulkCreateRoomsResponse>>(
        `/spaces/${spaceId}/units/${unitId}/rooms/bulk`,
        body,
      ),
    );

    devLog(`${LOG_TAG} bulkCreateRoomsUnderUnit response`, response.roomsCreated);
    return response;
  },

  bulkCreateBeds: async (
    spaceId: UUID,
    roomId: UUID,
    body: BulkCreateBedsRequest,
  ): Promise<BulkCreateBedsResponse> => {
    devLog(`${LOG_TAG} POST /spaces/${spaceId}/rooms/${roomId}/beds/bulk`, body);

    const response = await unwrapApiResponse(
      apiClient.post<ApiResponse<BulkCreateBedsResponse>>(
        `/spaces/${spaceId}/rooms/${roomId}/beds/bulk`,
        body,
      ),
    );

    devLog(`${LOG_TAG} bulkCreateBeds response`, response.bedsCreated);
    return response;
  },

  searchAllocationTargets: async (
    spaceId: UUID,
    params?: AllocationTargetSearchParams,
  ): Promise<PagedResponse<AllocationTargetSearchResponse>> => {
    const q = new URLSearchParams();
    if (params?.query?.trim()) {
      q.set('query', params.query.trim());
    }
    if (params?.targetType) {
      q.set('targetType', params.targetType);
    }
    if (params?.buildingId) {
      q.set('buildingId', params.buildingId);
    }
    if (params?.floorId) {
      q.set('floorId', params.floorId);
    }
    if (params?.unitId) {
      q.set('unitId', params.unitId);
    }
    if (params?.status) {
      q.set('status', params.status);
    }
    if (params?.selectableOnly != null) {
      q.set('selectableOnly', String(params.selectableOnly));
    }
    if (params?.page != null) {
      q.set('page', String(params.page));
    }
    if (params?.size != null) {
      q.set('size', String(params.size));
    }
    const query = q.toString();
    const path = `/spaces/${spaceId}/accommodation/allocation-targets${query ? `?${query}` : ''}`;
    devLog(`${LOG_TAG} GET ${path}`);

    const response = await unwrapApiResponse(
      apiClient.get<ApiResponse<PagedResponse<AllocationTargetSearchResponse>>>(path),
    );

    devLog(`${LOG_TAG} searchAllocationTargets response`, response.content.length);
    return response;
  },
};
