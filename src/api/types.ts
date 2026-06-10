export type UUID = string;

export type SpaceType = 'PG' | 'MESS' | 'HOSTEL' | 'CO_LIVING' | 'RENTAL';

export type MembershipRole =
  | 'OWNER'
  | 'MANAGER'
  | 'TENANT'
  | 'CUSTOMER'
  | 'STAFF';

export type MembershipStatus =
  | 'INVITATION_SENT'
  | 'ACCEPTED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'REMOVED'
  | 'VACATED';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
}

export interface SpaceResponse {
  id: UUID;
  name: string;
  type: SpaceType;
  address?: string;
  contactNumber?: string;
  active: boolean;
  ownerId: UUID;
  ownerName: string;
  createdAt: string;
}

export interface UserSpaceResponse {
  spaceId: UUID;
  spaceName: string;
  spaceType: SpaceType;
  role: MembershipRole;
  membershipStatus: MembershipStatus;
}

export interface InvitationResponse {
  id: UUID;
  spaceId: UUID;
  spaceName: string;
  invitedByUserId: UUID;
  mobileNumber: string;
  role: MembershipRole;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
}

export interface SpaceMembershipResponse {
  id: UUID;
  spaceId: UUID;
  spaceName: string;
  userId: UUID;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt?: string;
  createdAt: string;
}

/** App-level space model used by stores and navigation. */
export interface Space {
  id: UUID;
  ownerId: UUID;
  name: string;
  type: SpaceType;
  address: string | null;
  contactNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role?: MembershipRole;
  membershipStatus?: MembershipStatus;
}

export interface CreateSpaceRequest {
  name: string;
  type: SpaceType;
  address?: string;
  contactNumber?: string;
  ownerId: UUID;
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

// ─── Auth types ────────────────────────────────────────────────────────────

export interface SendOtpRequest {
  mobileNumber: string;
}

export interface SendOtpResponse {
  mobileNumber: string;
  message: string;
}

export interface VerifyOtpRequest {
  mobileNumber: string;
  otp: string;
}

export interface UserResponse {
  id: UUID;
  mobileNumber: string;
  fullName: string;
  profilePhotoUrl?: string | null;
  active: boolean;
  createdAt: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: UserResponse;
}

// ─── Error types ────────────────────────────────────────────────────────────

export interface ApiErrorBody {
  success?: boolean;
  message?: string;
  error?: string;
  data?: Record<string, string> | null;
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
