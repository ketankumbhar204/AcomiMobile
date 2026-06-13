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
  address?: string | null;
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
  occupancyStatus?: MemberOccupancyStatus;
  currentOccupancy?: CurrentOccupancySummaryResponse | null;
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

// ─── Accommodation (Phase 4.1) ──────────────────────────────────────────────

export type AccommodationStatus =
  | 'AVAILABLE'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'MAINTENANCE'
  | 'BLOCKED';

export type RoomType = 'PRIVATE' | 'SHARED' | 'DORMITORY';

export type PropertyLayoutMode =
  | 'CORRIDOR_PG'
  | 'APARTMENT_PG'
  | 'CO_LIVING'
  | 'RENTAL';

export type UnitKind =
  | 'SINGLE_ROOM'
  | 'STUDIO'
  | 'RK'
  | 'BHK_1'
  | 'BHK_2'
  | 'BHK_3'
  | 'FLAT'
  | 'DORMITORY'
  | 'SUITE';

export interface CreateBuildingRequest {
  name: string;
  code?: string;
  layoutMode?: PropertyLayoutMode;
}

export interface UpdateBuildingRequest {
  name: string;
  code?: string;
  layoutMode?: PropertyLayoutMode;
}

export interface CreateFloorRequest {
  name: string;
  floorNumber: number;
  sortOrder?: number;
}

export interface UpdateFloorRequest {
  name: string;
  floorNumber: number;
  sortOrder: number;
}

export interface CreateUnitRequest {
  name: string;
  unitNumber: string;
  status?: AccommodationStatus;
  unitKind?: UnitKind;
}

export interface UpdateUnitRequest {
  name: string;
  unitNumber: string;
  status: AccommodationStatus;
  unitKind?: UnitKind;
}

export interface CreateRoomRequest {
  name: string;
  roomNumber: string;
  roomType: RoomType;
  capacity: number;
  status?: AccommodationStatus;
}

export interface UpdateRoomRequest {
  name: string;
  roomNumber: string;
  roomType: RoomType;
  capacity: number;
  status: AccommodationStatus;
}

export interface CreateBedRequest {
  name: string;
  bedNumber: string;
  status?: AccommodationStatus;
}

export interface UpdateBedRequest {
  name: string;
  bedNumber: string;
  status: AccommodationStatus;
}

export interface AccommodationActionMetadata {
  canEdit: boolean;
  canDeactivate: boolean;
  canRestore: boolean;
  canDelete: boolean;
  deleteReason?: string | null;
}

export interface BuildingResponse {
  buildingId: UUID;
  spaceId: UUID;
  name: string;
  code?: string | null;
  layoutMode: PropertyLayoutMode;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  actions?: AccommodationActionMetadata;
}

export interface FloorResponse {
  floorId: UUID;
  buildingId: UUID;
  name: string;
  floorNumber: number;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  actions?: AccommodationActionMetadata;
}

export interface UnitResponse {
  unitId: UUID;
  buildingId: UUID;
  floorId?: UUID | null;
  name: string;
  unitNumber: string;
  status: AccommodationStatus;
  synthetic: boolean;
  unitKind?: UnitKind | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  actions?: AccommodationActionMetadata;
}

export interface RoomResponse {
  roomId: UUID;
  buildingId?: UUID | null;
  floorId?: UUID | null;
  unitId?: UUID | null;
  name: string;
  roomNumber: string;
  roomType: RoomType;
  capacity: number;
  status: AccommodationStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  actions?: AccommodationActionMetadata;
}

export interface BedOccupantSummaryResponse {
  occupancyId: UUID;
  memberId: UUID;
  memberName: string;
  occupancyStatus: OccupancyStatus;
}

export interface BedResponse {
  bedId: UUID;
  roomId: UUID;
  name: string;
  bedNumber: string;
  status: AccommodationStatus;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  actions?: AccommodationActionMetadata;
  occupant?: BedOccupantSummaryResponse | null;
}

// ─── Accommodation Phase 4.2 orchestration ────────────────────────────────

export type BedLabelStyle = 'ALPHA' | 'NUMERIC';

export interface BuildingSetupInput {
  name: string;
  code?: string;
}

export interface PgHostelSetupConfig {
  count: number;
  includeGroundFloor?: boolean;
  apartmentsPerFloor?: number;
  roomsPerFloor: number;
  bedsPerRoom: number;
  defaultRoomType: RoomType;
  capacityPerRoom: number;
}

export interface UnitSetupConfig {
  count: number;
  startNumber?: string;
  numberingStep?: number;
  roomsPerUnit?: number;
  bedsPerRoom?: number;
  defaultRoomType?: RoomType;
  capacityPerRoom?: number;
  defaultStatus?: AccommodationStatus;
}

export interface AccommodationSetupRequest {
  spaceType: SpaceType;
  layoutMode?: PropertyLayoutMode;
  building: BuildingSetupInput;
  floors?: PgHostelSetupConfig;
  units?: UnitSetupConfig;
}

export interface AccommodationSetupTotals {
  floors: number;
  units: number;
  rooms: number;
  beds: number;
}

export interface AccommodationSetupSampleNode {
  type: string;
  label: string;
  number: string;
  children?: AccommodationSetupSampleNode[];
}

export interface AccommodationSetupPreviewResponse {
  totals: AccommodationSetupTotals;
  sample: AccommodationSetupSampleNode[];
  warnings: string[];
}

export interface AccommodationSetupResultResponse {
  buildingId: UUID;
  totals: AccommodationSetupTotals;
  idempotentReplay: boolean;
}

export interface StructureCountsResponse {
  floors: number;
  units: number;
  rooms: number;
  beds: number;
}

export interface StatusCountsResponse {
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
  blocked: number;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ListQueryParams {
  query?: string;
  page?: number;
  size?: number;
  sort?: string;
  view?: 'summary' | 'full';
  includeSynthetic?: boolean;
}

export interface BuildingSummaryResponse {
  buildingId: UUID;
  name: string;
  code?: string | null;
  spaceId: UUID;
  layoutMode: PropertyLayoutMode;
  unitCount: number;
  visibleUnitCount: number;
  syntheticUnitCount: number;
  floors: number;
  units: number;
  rooms: number;
  beds: number;
  available: number;
  occupied: number;
  reserved: number;
  maintenance: number;
  blocked: number;
  availableBeds?: number;
  occupiedBeds?: number;
  reservedBeds?: number;
  availableRooms?: number;
  occupiedRooms?: number;
  reservedRooms?: number;
  availableUnits?: number;
  occupiedUnits?: number;
  reservedUnits?: number;
}

export interface FloorListItemResponse {
  floorId: UUID;
  name: string;
  roomCount: number;
  bedCount: number;
  available: number;
  occupied: number;
}

export interface UnitListItemResponse {
  unitId: UUID;
  name: string;
  roomCount: number;
  bedCount: number;
  status: AccommodationStatus;
  synthetic: boolean;
  unitKind?: UnitKind | null;
}

export interface RoomListItemResponse {
  roomId: UUID;
  name: string;
  roomType: RoomType;
  bedCount: number;
  availableBeds: number;
  occupiedBeds: number;
}

export interface BedListItemResponse {
  bedId: UUID;
  label: string;
  status: AccommodationStatus;
}

export interface DuplicateBuildingRequest {
  targetBuildingName: string;
  targetBuildingCode?: string;
}

export interface DuplicateBuildingResponse {
  buildingId: UUID;
  name: string;
  code: string | null;
  floorsCreated: number;
  unitsCreated: number;
  roomsCreated: number;
  bedsCreated: number;
}

export interface DuplicateFloorRequest {
  targetFloorNumber: number;
  targetName?: string;
  renumberRooms?: boolean;
}

export interface DuplicateFloorResponse {
  floorId: UUID;
  floorNumber: number;
  roomsCreated: number;
  bedsCreated: number;
}

export interface DuplicateRoomRequest {
  targetRoomNumber?: string;
}

export interface DuplicateRoomResponse {
  roomId: UUID;
  roomNumber: string;
  bedsCreated: number;
}

export interface BulkCreateUnitsRequest {
  count: number;
  startUnitNumber?: string;
  defaultStatus?: AccommodationStatus;
}

export interface BulkCreateUnitsResponse {
  unitsCreated: number;
  unitIds: UUID[];
}

export interface BulkCreateRoomsRequest {
  count: number;
  startRoomNumber?: string;
  roomType: RoomType;
  capacity: number;
  bedsPerRoom: number;
  defaultStatus?: AccommodationStatus;
}

export interface BulkCreateRoomsResponse {
  roomsCreated: number;
  bedsCreated: number;
  roomIds: UUID[];
}

export interface BulkCreateBedsRequest {
  count: number;
  labelStyle: BedLabelStyle;
}

export interface BulkCreateBedsResponse {
  bedsCreated: number;
  bedIds: UUID[];
}

// ─── Occupancy (Phase 4.3) ──────────────────────────────────────────────────

export type AllocationTargetType = 'BED' | 'ROOM' | 'UNIT';
export type OccupancyStatus = 'ACTIVE' | 'RESERVED' | 'VACATED';
export type MemberOccupancyStatus = 'ALLOCATED' | 'RESERVED' | 'VACATED';
export type OccupancyHistoryEvent =
  | 'ALLOCATED'
  | 'RESERVED'
  | 'MOVE_IN'
  | 'TRANSFERRED'
  | 'VACATED'
  | 'RESERVATION_CANCELLED';
export type MemberGender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED';
export type MemberCategory =
  | 'STUDENT'
  | 'WORKING_PROFESSIONAL'
  | 'FAMILY'
  | 'GUEST'
  | 'INTERN';
export type GenderPolicy = 'MALE' | 'FEMALE' | 'MIXED';

export interface OccupancyResponse {
  occupancyId: UUID;
  spaceId: UUID;
  memberId: UUID;
  memberName: string;
  targetType: AllocationTargetType;
  buildingId: UUID;
  buildingName: string;
  floorId?: UUID | null;
  floorName?: string | null;
  unitId?: UUID | null;
  unitName?: string | null;
  roomId?: UUID | null;
  roomName?: string | null;
  bedId?: UUID | null;
  bedName?: string | null;
  allocatedAt: string;
  allocatedBy: UUID;
  expectedCheckoutDate?: string | null;
  reservedAt?: string | null;
  moveInDate?: string | null;
  actualMoveInAt?: string | null;
  expectedExitDate?: string | null;
  memberCategory?: MemberCategory | null;
  agreementSigned?: boolean;
  vacatedAt?: string | null;
  vacatedBy?: UUID | null;
  status: OccupancyStatus;
  remarks?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OccupancyHistoryEntryResponse {
  historyId: UUID;
  occupancyId: UUID;
  eventType: OccupancyHistoryEvent;
  fromTargetType?: AllocationTargetType | null;
  fromBuildingId?: UUID | null;
  fromFloorId?: UUID | null;
  fromUnitId?: UUID | null;
  fromRoomId?: UUID | null;
  fromBedId?: UUID | null;
  toTargetType?: AllocationTargetType | null;
  toBuildingId?: UUID | null;
  toFloorId?: UUID | null;
  toUnitId?: UUID | null;
  toRoomId?: UUID | null;
  toBedId?: UUID | null;
  performedBy: UUID;
  performedAt: string;
  remarks?: string | null;
}

export interface MemberOccupancyListResponse {
  currentOccupancy: OccupancyResponse | null;
  reservedOccupancy: OccupancyResponse | null;
  occupancies: OccupancyResponse[];
  history: OccupancyHistoryEntryResponse[];
}

export interface CurrentOccupancySummaryResponse {
  occupancyId?: UUID;
  occupancyStatus?: OccupancyStatus;
  targetType: AllocationTargetType;
  buildingId: UUID;
  buildingName: string;
  floorId?: UUID | null;
  floorName?: string | null;
  unitId?: UUID | null;
  unitName?: string | null;
  roomId?: UUID | null;
  roomName?: string | null;
  bedId?: UUID | null;
  bedName?: string | null;
  moveInDate?: string | null;
}

export interface ReserveOccupancyRequest {
  memberId: UUID;
  targetType: AllocationTargetType;
  bedId?: UUID | null;
  roomId?: UUID | null;
  unitId?: UUID | null;
  moveInDate: string;
  expectedExitDate?: string | null;
  memberCategory?: MemberCategory | null;
  remarks?: string | null;
}

export interface MoveInOccupancyRequest {
  moveInDate?: string | null;
  expectedExitDate?: string | null;
  allowEarlyMoveIn?: boolean;
  agreementSigned?: boolean;
  remarks?: string | null;
}

export interface CancelReservationRequest {
  remarks?: string | null;
}

export interface AllocateOccupancyRequest {
  memberId: UUID;
  targetType: AllocationTargetType;
  bedId?: UUID | null;
  roomId?: UUID | null;
  unitId?: UUID | null;
  expectedCheckoutDate?: string | null;
  expectedExitDate?: string | null;
  remarks?: string | null;
}

export interface TransferOccupancyRequest {
  targetType: AllocationTargetType;
  bedId?: UUID | null;
  roomId?: UUID | null;
  unitId?: UUID | null;
  remarks?: string | null;
}

export interface VacateOccupancyRequest {
  remarks?: string | null;
}

export interface OccupancyListFilters {
  status?: OccupancyStatus;
  memberId?: UUID;
  buildingId?: UUID;
  floorId?: UUID;
  unitId?: UUID;
  roomId?: UUID;
  bedId?: UUID;
  targetType?: AllocationTargetType;
  page?: number;
  size?: number;
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
