import apiClient from './client';
import { unwrapVoidResponse } from './apiRequest';
import type { UUID } from './types';
import { devLog } from '../utils/devLog';

const LOG_TAG = '[AccommodationLifecycleAPI]';

async function postLifecycle(path: string): Promise<void> {
  devLog(`${LOG_TAG} POST ${path}`);

  await unwrapVoidResponse(
    apiClient.post(path),
  );

  devLog(`${LOG_TAG} success ${path}`);
}

export const accommodationLifecycleApi = {
  deactivateBuilding: (spaceId: UUID, buildingId: UUID) =>
    postLifecycle(`/spaces/${spaceId}/buildings/${buildingId}/deactivate`),

  restoreBuilding: (spaceId: UUID, buildingId: UUID) =>
    postLifecycle(`/spaces/${spaceId}/buildings/${buildingId}/restore`),

  deleteBuilding: (spaceId: UUID, buildingId: UUID) =>
    postLifecycle(`/spaces/${spaceId}/buildings/${buildingId}/delete`),

  deactivateFloor: (spaceId: UUID, floorId: UUID) =>
    postLifecycle(`/spaces/${spaceId}/floors/${floorId}/deactivate`),

  restoreFloor: (spaceId: UUID, floorId: UUID) =>
    postLifecycle(`/spaces/${spaceId}/floors/${floorId}/restore`),

  deleteFloor: (spaceId: UUID, floorId: UUID) =>
    postLifecycle(`/spaces/${spaceId}/floors/${floorId}/delete`),

  deactivateUnit: (spaceId: UUID, unitId: UUID) =>
    postLifecycle(`/spaces/${spaceId}/units/${unitId}/deactivate`),

  restoreUnit: (spaceId: UUID, unitId: UUID) =>
    postLifecycle(`/spaces/${spaceId}/units/${unitId}/restore`),

  deleteUnit: (spaceId: UUID, unitId: UUID) =>
    postLifecycle(`/spaces/${spaceId}/units/${unitId}/delete`),

  deactivateRoom: (spaceId: UUID, roomId: UUID) =>
    postLifecycle(`/spaces/${spaceId}/rooms/${roomId}/deactivate`),

  restoreRoom: (spaceId: UUID, roomId: UUID) =>
    postLifecycle(`/spaces/${spaceId}/rooms/${roomId}/restore`),

  deleteRoom: (spaceId: UUID, roomId: UUID) =>
    postLifecycle(`/spaces/${spaceId}/rooms/${roomId}/delete`),

  deactivateBed: (spaceId: UUID, bedId: UUID) =>
    postLifecycle(`/spaces/${spaceId}/beds/${bedId}/deactivate`),

  restoreBed: (spaceId: UUID, bedId: UUID) =>
    postLifecycle(`/spaces/${spaceId}/beds/${bedId}/restore`),

  deleteBed: (spaceId: UUID, bedId: UUID) =>
    postLifecycle(`/spaces/${spaceId}/beds/${bedId}/delete`),
};
