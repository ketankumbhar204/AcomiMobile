import { unwrapApiResponse } from './apiRequest';
import apiClient from './client';
import type { ApiResponse, UUID } from './types';
import type { EntityPhotoKind } from '../files/entityPhoto';

function pathFor(kind: EntityPhotoKind, spaceId: UUID, entityId: UUID): string {
  switch (kind) {
    case 'space':
      return `/spaces/${spaceId}/photo`;
    case 'building':
      return `/spaces/${spaceId}/buildings/${entityId}/photo`;
    case 'floor':
      return `/spaces/${spaceId}/floors/${entityId}/photo`;
    case 'unit':
      return `/spaces/${spaceId}/units/${entityId}/photo`;
    case 'room':
      return `/spaces/${spaceId}/rooms/${entityId}/photo`;
    case 'bed':
      return `/spaces/${spaceId}/beds/${entityId}/photo`;
    case 'menuItem':
      return `/spaces/${spaceId}/food-items/${entityId}/photo`;
    case 'combo':
      return `/spaces/${spaceId}/meal-combos/${entityId}/photo`;
    default:
      return `/spaces/${spaceId}/photo`;
  }
}

export const entityPhotoApi = {
  replace: async (kind: EntityPhotoKind, spaceId: UUID, entityId: UUID, fileId: UUID) => {
    await unwrapApiResponse(
      apiClient.put<ApiResponse<unknown>>(pathFor(kind, spaceId, entityId), { fileId }),
    );
  },
  remove: async (kind: EntityPhotoKind, spaceId: UUID, entityId: UUID) => {
    await unwrapApiResponse(
      apiClient.delete<ApiResponse<unknown>>(pathFor(kind, spaceId, entityId)),
    );
  },
};
