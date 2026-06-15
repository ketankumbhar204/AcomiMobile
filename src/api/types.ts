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
  /** When true, food is mandatory and bundled in rent — no separate food charge. */
  foodIncludedInRent?: boolean;
  /** Default separate food charge when food is not bundled in rent. */
  defaultFoodCharge?: number | null;
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

export interface SpacePermissionsResponse {
  canViewAccommodation: boolean;
  canManageAccommodation: boolean;
  canDeactivateAccommodation: boolean;
  canManageOccupancy: boolean;
  canViewSpaceOccupancies: boolean;
  canManageMembers: boolean;
  canRemoveMember: boolean;
  canManageMeals?: boolean;
  canViewMeals?: boolean;
  canManageMealParticipation?: boolean;
  canViewOwnMealParticipation?: boolean;
}

export type MealPlanCode =
  | 'NONE'
  | 'BREAKFAST'
  | 'LUNCH'
  | 'DINNER'
  | 'FULL'
  | 'CUSTOM';

export type MealParticipationStatus = 'ACTIVE' | 'PAUSED' | 'STOPPED';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER';

export type DailyMenuStatus = 'DRAFT' | 'PUBLISHED';

export type DailyMenuEntryType = 'COMBO' | 'ITEM';

export interface MealPlanResponse {
  mealPlanId: UUID;
  code: MealPlanCode;
  name: string;
  breakfastIncluded: boolean;
  lunchIncluded: boolean;
  dinnerIncluded: boolean;
  isActive: boolean;
}

export interface MealParticipationResponse {
  participationId: UUID;
  memberId: UUID;
  memberName: string;
  memberRole: MembershipRole;
  mealPlanId: UUID;
  mealPlanCode: MealPlanCode;
  mealPlanName: string;
  status: MealParticipationStatus;
  effectiveFrom: string;
  effectiveTo?: string | null;
  sourceOccupancyId?: UUID | null;
}

export type FoodCatalogScope = 'GLOBAL' | 'SPACE';

export interface FoodCategoryResponse {
  categoryId: UUID;
  name: string;
  sortOrder: number;
  scope: FoodCatalogScope;
  isActive: boolean;
  itemCount?: number;
}

export interface FoodItemResponse {
  itemId: UUID;
  categoryId: UUID;
  categoryName?: string;
  name: string;
  scope: FoodCatalogScope;
  isCustom: boolean;
  isActive: boolean;
}

export interface CreateFoodCategoryRequest {
  name: string;
}

export interface CreateFoodItemRequest {
  categoryId: UUID;
  name: string;
}

export interface UpdateFoodItemRequest {
  categoryId?: UUID;
  name?: string;
}

export interface CreateMealComboRequest {
  name: string;
  description?: string | null;
  itemIds: UUID[];
}

export interface UpdateMealComboRequest {
  name?: string;
  description?: string | null;
  itemIds?: UUID[];
}

export interface MealComboResponse {
  comboId: UUID;
  name: string;
  description?: string | null;
  scope?: FoodCatalogScope;
  isActive: boolean;
  items?: Array<{ itemId: UUID; name: string }>;
}

export interface DailyMenuOptionResponse {
  optionId?: UUID;
  entryType?: DailyMenuEntryType;
  comboId?: UUID | null;
  itemId?: UUID | null;
  label: string;
  sortOrder: number;
  isAvailable: boolean;
}

export interface DailyMenuResponse {
  dailyMenuId?: UUID;
  menuDate: string;
  mealType: MealType;
  status: DailyMenuStatus;
  publishedAt?: string | null;
  notes?: string | null;
  options: DailyMenuOptionResponse[];
}

export interface UpsertDailyMenuRequest {
  options: Array<{
    entryType?: DailyMenuEntryType;
    comboId?: UUID | null;
    itemId?: UUID | null;
    label: string;
    sortOrder: number;
    isAvailable: boolean;
  }>;
  notes?: string | null;
}

export interface CreateMealParticipationRequest {
  memberId: UUID;
  mealPlanId: UUID;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface UpdateMealParticipationRequest {
  mealPlanId?: UUID;
  status?: MealParticipationStatus;
}

export interface MealParticipationSearchParams {
  status?: MealParticipationStatus;
  mealPlanCode?: MealPlanCode;
  search?: string;
}

export interface MealEligibilitySummaryResponse {
  date: string;
  slots: Array<{
    mealType: MealType;
    eligibleCount: number;
    published: boolean;
    pausedCount?: number;
  }>;
}

export interface MealEligibleParticipantResponse {
  memberId: UUID;
  memberName: string;
  mobileNumber?: string | null;
  mealPlanCode: MealPlanCode;
  mealPlanName?: string;
}

export interface CopyDailyMenuRequest {
  force?: boolean;
  publish?: boolean;
}

export interface MealSharePreviewLine {
  label: string;
  detail?: string | null;
}

export interface MealSharePreviewSlot {
  mealType: MealType;
  lines: MealSharePreviewLine[];
}

export interface MealSharePreviewResponse {
  date: string;
  messageText: string;
  slots: MealSharePreviewSlot[];
}

export interface MemberMealParticipationSummary {
  participationId: UUID;
  mealPlanCode: MealPlanCode;
  mealPlanName: string;
  status: MealParticipationStatus;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface MySpaceResponse {
  spaceId: UUID;
  spaceName: string;
  spaceType: SpaceType;
  membershipRole: MembershipRole;
  isDefault: boolean;
  joinedAt: string;
  address?: string | null;
  permissions?: SpacePermissionsResponse;
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
  foodIncludedInRent?: boolean;
  defaultFoodCharge?: number | null;
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
  linkedUserId?: UUID | null;
  status: MemberStatus;
  occupancyStatus?: MemberOccupancyStatus;
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
  mealParticipation?: MemberMealParticipationSummary | null;
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
  foodIncludedInRent?: boolean;
  defaultFoodCharge?: number | null;
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
  defaultRent?: number | null;
  defaultDeposit?: number | null;
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
  defaultRent?: number | null;
  defaultDeposit?: number | null;
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
  defaultRent?: number | null;
  defaultDeposit?: number | null;
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
  defaultRent?: number | null;
  defaultDeposit?: number | null;
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
  defaultRent?: number | null;
  defaultDeposit?: number | null;
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
  defaultRent?: number | null;
  defaultDeposit?: number | null;
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

export interface MemberSearchParams {
  search?: string;
  occupancyStatus?: MemberOccupancyStatus;
}

export interface AllocationTargetSearchParams {
  query?: string;
  targetType?: 'BED' | 'UNIT';
  buildingId?: UUID;
  floorId?: UUID;
  unitId?: UUID;
  status?: AccommodationStatus;
  selectableOnly?: boolean;
  page?: number;
  size?: number;
}

export interface AllocationTargetSearchResponse {
  targetType: 'BED' | 'UNIT';
  targetId: UUID;
  buildingId: UUID;
  buildingName: string;
  floorId?: UUID | null;
  floorName?: string | null;
  unitId?: UUID | null;
  unitName?: string | null;
  roomId?: UUID | null;
  roomName?: string | null;
  roomNumber?: string | null;
  bedId?: UUID | null;
  bedName?: string | null;
  bedNumber?: string | null;
  displayPath: string;
  displayPathShort: string;
  status: AccommodationStatus;
  defaultRent?: number | null;
  defaultDeposit?: number | null;
  selectable: boolean;
  notSelectableReason?: string | null;
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

export type OccupancyChargeCode =
  | 'PARKING'
  | 'LAUNDRY'
  | 'ELECTRICITY'
  | 'WIFI'
  | 'MAINTENANCE'
  | 'OTHER';

export type TransferRentPolicy = 'KEEP' | 'APPLY_NEW' | 'CUSTOM';

export type OccupancyChargeLine = {
  code: OccupancyChargeCode;
  label: string;
  amount: number;
};

export type ContractSnapshotInput = {
  rentSnapshot?: number | null;
  depositSnapshot?: number | null;
  foodEnabled?: boolean;
  foodChargeSnapshot?: number | null;
  /** True when food is mandatory and included in rent (no separate food line). */
  foodIncludedInRent?: boolean;
  otherCharges?: OccupancyChargeLine[];
};

export interface OccupancyChargeSnapshotResponse {
  chargeSnapshotId: UUID;
  code: OccupancyChargeCode;
  label: string;
  amount: number;
}

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
  rentSnapshot?: number | null;
  depositSnapshot?: number | null;
  foodEnabled?: boolean;
  foodChargeSnapshot?: number | null;
  foodIncludedInRent?: boolean;
  pricingLockedAt?: string | null;
  otherCharges?: OccupancyChargeSnapshotResponse[];
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
  rentSnapshot?: number | null;
  depositSnapshot?: number | null;
  foodEnabled?: boolean;
  foodChargeSnapshot?: number | null;
  otherCharges?: OccupancyChargeLine[];
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
  rentSnapshot?: number | null;
  depositSnapshot?: number | null;
  foodEnabled?: boolean;
  foodChargeSnapshot?: number | null;
  otherCharges?: OccupancyChargeLine[];
}

export interface TransferOccupancyRequest {
  targetType: AllocationTargetType;
  bedId?: UUID | null;
  roomId?: UUID | null;
  unitId?: UUID | null;
  remarks?: string | null;
  rentPolicy?: TransferRentPolicy;
  rentSnapshot?: number | null;
  depositSnapshot?: number | null;
  foodEnabled?: boolean;
  foodChargeSnapshot?: number | null;
  otherCharges?: OccupancyChargeLine[];
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
  errorCode?: string;
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
