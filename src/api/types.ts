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

export type InvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REJECTED';

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
  isActive: boolean;
  ownerId: UUID;
  ownerName: string;
  createdAt: string;
}

export interface SpaceDetailsResponse {
  id: UUID;
  name: string;
  type: SpaceType;
  address?: string;
  contactNumber?: string;
  ownerId: UUID;
  createdAt: string;
  updatedAt: string;
}

export interface UserSpaceResponse {
  spaceId: UUID;
  spaceName: string;
  spaceType: SpaceType;
  membershipRole: MembershipRole;
  joinedAt: string;
}

export interface MySpaceResponse {
  spaceId: UUID;
  spaceName: string;
  spaceType: SpaceType;
  membershipRole: MembershipRole;
  isDefault: boolean;
  joinedAt: string;
}

export interface DefaultSpaceResponse {
  spaceId: UUID;
  spaceName: string;
  spaceType: SpaceType;
}

export interface SetDefaultSpaceResponse {
  spaceId: UUID;
  spaceName: string;
  isDefault: boolean;
}

export interface UpdateSpaceRequest {
  name: string;
  address?: string;
  contactNumber?: string;
}

export interface CreateMemberRequest {
  fullName: string;
  mobileNumber: string;
  role: MembershipRole;
}

export interface UpdateMemberRequest {
  fullName: string;
  mobileNumber: string;
  role: MembershipRole;
}

export type MemberStatus = 'ACTIVE' | 'VACATED' | 'SUSPENDED' | 'BLACKLISTED';

export type MemberDocumentType =
  | 'AADHAAR'
  | 'PAN'
  | 'PASSPORT'
  | 'DRIVING_LICENSE'
  | 'STUDENT_ID'
  | 'OTHER';

export type DocumentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type MemberHistoryAction =
  | 'STATUS_CHANGED'
  | 'DEPOSIT_UPDATED'
  | 'EMERGENCY_CONTACT_UPDATED';

export interface UpdateMemberStatusRequest {
  status: MemberStatus;
}

export interface UpdateEmergencyContactRequest {
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactMobile: string;
}

export interface UpdateDepositRequest {
  depositAmount: number;
  depositPaid: number;
  depositRefunded: number;
}

export interface CreateMemberDocumentRequest {
  documentType: MemberDocumentType;
  documentNumber: string;
  fileUrl: string;
}

export interface CreateMemberNoteRequest {
  note: string;
}

export interface MemberDocumentResponse {
  documentId: UUID;
  documentType: MemberDocumentType;
  documentNumber: string;
  fileUrl: string;
  verificationStatus: DocumentVerificationStatus;
  uploadedAt: string;
}

export interface MemberNoteResponse {
  noteId: UUID;
  note: string;
  createdBy: UUID;
  createdByName: string;
  createdAt: string;
}

export interface MemberHistoryResponse {
  historyId: UUID;
  action: MemberHistoryAction;
  oldValue?: string | null;
  newValue?: string | null;
  changedBy: UUID;
  changedByName: string;
  changedAt: string;
}

export interface MemberResponse {
  memberId: UUID;
  fullName: string;
  mobileNumber: string;
  role: MembershipRole;
  linkedUser: boolean;
  status: MemberStatus;
  createdAt: string;
}

export interface MemberDetailsResponse {
  memberId: UUID;
  spaceId: UUID;
  fullName: string;
  mobileNumber: string;
  role: MembershipRole;
  linkedUser: boolean;
  linkedUserId?: UUID | null;
  membershipId?: UUID | null;
  active: boolean;
  status: MemberStatus;
  statusUpdatedAt?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactMobile?: string | null;
  depositAmount: number;
  depositPaid: number;
  depositRefunded: number;
  depositBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface PendingInvitationResponse {
  invitationId: UUID;
  mobileNumber: string;
  role: MembershipRole;
  status: InvitationStatus;
  invitedBy: string;
  createdAt: string;
}

/** @deprecated Use UpdateMemberRequest with memberId */
export interface UpdateMemberRoleRequest {
  role: MembershipRole;
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
  joinedAt?: string;
  isDefault?: boolean;
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
