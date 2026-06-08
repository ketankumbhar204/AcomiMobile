export type UUID = string;

export type SpaceType = 'PG' | 'MESS' | 'HOSTEL' | 'CO_LIVING';

export type MembershipRole =
  | 'OWNER'
  | 'MANAGER'
  | 'TENANT'
  | 'CUSTOMER'
  | 'STAFF';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface AuditableEntity {
  id: UUID;
  createdAt: string;
  updatedAt: string;
}

export interface Space extends AuditableEntity {
  ownerId: UUID;
  name: string;
  type: SpaceType;
  address: string | null;
  contactNumber: string | null;
  isActive: boolean;
}

export interface CreateSpaceRequest {
  name: string;
  type: SpaceType;
  address?: string;
  contactNumber?: string;
  ownerId: UUID;
}

export interface Invitation extends AuditableEntity {
  spaceId: UUID;
  invitedByUserId: UUID;
  mobileNumber: string;
  role: MembershipRole;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
}

export interface CreateInvitationRequest {
  spaceId: UUID;
  invitedByUserId: UUID;
  mobileNumber: string;
  role: MembershipRole;
}

export interface AcceptInvitationRequest {
  userId: UUID;
}

export interface ApiErrorBody {
  message?: string;
  error?: string;
  status?: number;
  timestamp?: string;
  path?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | undefined;
  readonly isNetworkError: boolean;

  constructor(
    message: string,
    status: number,
    body?: ApiErrorBody,
    isNetworkError = false,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.isNetworkError = isNetworkError;
  }
}
