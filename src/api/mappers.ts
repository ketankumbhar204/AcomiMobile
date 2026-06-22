import type {
  DefaultSpaceResponse,
  MySpaceResponse,
  Space,
  SpaceDetailsResponse,
  SpaceResponse,
  UserSpaceResponse,
} from './types';
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
    isActive: response.isActive,
    createdAt: response.createdAt,
    updatedAt: response.createdAt,
    role: 'OWNER',
  };
}

export function spaceDetailsResponseToSpace(
  response: SpaceDetailsResponse,
): Space {
  return {
    id: response.id,
    ownerId: response.ownerId,
    name: response.name,
    type: response.type,
    address: response.address ?? null,
    contactNumber: response.contactNumber ?? null,
    isActive: true,
    foodIncludedInRent: response.foodIncludedInRent,
    defaultFoodCharge: response.defaultFoodCharge ?? null,
    mealBillingType: response.mealBillingType ?? 'PAY_PER_MEAL',
    prepaidBalanceUnit: response.prepaidBalanceUnit ?? null,
    prepaidFallbackToPayPerMeal: response.prepaidFallbackToPayPerMeal ?? true,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
  };
}

export function mySpaceResponseToSpace(response: MySpaceResponse): Space {
  return {
    id: response.spaceId,
    ownerId: '',
    name: response.spaceName,
    type: response.spaceType,
    address: null,
    contactNumber: null,
    isActive: true,
    createdAt: response.joinedAt,
    updatedAt: response.joinedAt,
    role: response.membershipRole,
    joinedAt: response.joinedAt,
    isDefault: response.isDefault,
  };
}

export function defaultSpaceResponseToSpace(
  response: DefaultSpaceResponse,
): Space {
  return {
    id: response.spaceId,
    ownerId: '',
    name: response.spaceName,
    type: response.spaceType,
    address: null,
    contactNumber: null,
    isActive: true,
    createdAt: '',
    updatedAt: '',
    isDefault: true,
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
    isActive: true,
    createdAt: response.joinedAt,
    updatedAt: response.joinedAt,
    role: response.membershipRole,
    joinedAt: response.joinedAt,
  };
}
