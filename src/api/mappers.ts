import type { Space, SpaceResponse, UserSpaceResponse } from './types';
export {
  formatSpaceType,
  getSpaceTypeDescription,
  getSpaceTypeLabel,
  spaceTypeIconLabel,
  SPACE_TYPE_VALUES,
} from './spaceTypes';

export function spaceResponseToSpace(response: SpaceResponse): Space {
  return {
    id: response.id,
    ownerId: response.ownerId,
    name: response.name,
    type: response.type,
    address: response.address ?? null,
    contactNumber: response.contactNumber ?? null,
    isActive: response.active,
    createdAt: response.createdAt,
    updatedAt: response.createdAt,
  };
}

export function userSpaceResponseToSpace(response: UserSpaceResponse): Space {
  return {
    id: response.spaceId,
    ownerId: '',
    name: response.spaceName,
    type: response.spaceType,
    address: null,
    contactNumber: null,
    isActive: response.membershipStatus === 'ACTIVE',
    createdAt: '',
    updatedAt: '',
    role: response.role,
    membershipStatus: response.membershipStatus,
  };
}
