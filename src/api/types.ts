export type UUID = string;

export type SpaceType = 'PG' | 'MESS' | 'HOSTEL' | 'CO_LIVING' | 'RENTAL';

export interface AmenityAssignment {
  code: string;
  label: string;
}

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
  /** Mess billing mode — pay per meal or prepaid balance. */
  mealBillingType?: MealBillingType;
  prepaidBalanceUnit?: PrepaidBalanceUnit | null;
  prepaidFallbackToPayPerMeal?: boolean;
  genderPolicy?: GenderPolicy | null;
  amenities?: AmenityAssignment[];
  createdAt: string;
  updatedAt: string;
}

export type MealBillingType = 'PAY_PER_MEAL' | 'PREPAID_BALANCE';

export type PrepaidBalanceUnit = 'MEALS' | 'CURRENCY';

export interface MealBillingSettings {
  billingType: MealBillingType;
  prepaidBalanceUnit?: PrepaidBalanceUnit | null;
  fallbackToPayPerMeal: boolean;
}

export interface UpdateMealBillingSettingsRequest {
  billingType: MealBillingType;
  prepaidBalanceUnit?: PrepaidBalanceUnit | null;
  fallbackToPayPerMeal?: boolean;
}

export interface PrepaidBalanceSummary {
  balanceSold: number | null;
  balanceConsumed: number | null;
  balanceRemaining: number | null;
  amountCollected?: number | null;
  unit?: PrepaidBalanceUnit;
  currencyCode?: string;
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
  canRaiseComplaint?: boolean;
  canViewAllComplaints?: boolean;
  canManageComplaints?: boolean;
  /** Stock / asset inventory (operators). */
  canViewInventory?: boolean;
  canManageInventory?: boolean;
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

export type DailyMenuStatus = 'DRAFT' | 'PUBLISHED' | 'MODIFIED';

export type DailyMenuEntryType = 'COMBO' | 'ITEM' | 'PACKAGE';

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
  defaultDeliveryLocationId?: UUID | null;
  defaultDeliveryLocationName?: string | null;
}

export type FoodCatalogScope = 'GLOBAL' | 'SPACE';

export type FoodType = 'VEG' | 'NON_VEG' | 'EGG';

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
  foodType?: FoodType;
  defaultPrice?: number | null;
  currencyCode?: string | null;
  /** Mess Menu Library: item can be enabled as a meal extra. */
  isExtra?: boolean;
}

export interface UpdateFoodItemDefaultPriceRequest {
  price: number;
  currencyCode?: string | null;
}

export interface CreateFoodCategoryRequest {
  name: string;
}

export interface CreateFoodItemRequest {
  categoryId: UUID;
  name: string;
  foodType?: FoodType;
  /** Mess-only: create already marked as a library extra. */
  isExtra?: boolean;
}

export interface UpdateFoodItemRequest {
  categoryId?: UUID;
  name?: string;
  foodType?: FoodType;
}

export interface UpdateFoodItemExtraRequest {
  isExtra: boolean;
}

export interface CreateMealComboRequest {
  name: string;
  description?: string | null;
  itemIds: UUID[];
  /** Mess-only optional quantities; missing items default to 1. */
  itemQuantities?: Array<{ itemId: UUID; quantity: number }>;
  price?: number | null;
  currencyCode?: string | null;
  foodType?: FoodType;
}

export interface UpdateMealComboRequest {
  name?: string;
  description?: string | null;
  itemIds?: UUID[];
  /** Mess-only optional quantities; missing items default to 1. */
  itemQuantities?: Array<{ itemId: UUID; quantity: number }>;
  price?: number | null;
  currencyCode?: string | null;
  foodType?: FoodType;
}

export interface MealComboResponse {
  comboId: UUID;
  name: string;
  description?: string | null;
  scope?: FoodCatalogScope;
  isActive: boolean;
  price?: number | null;
  currencyCode?: string | null;
  foodType?: FoodType;
  items?: Array<{ itemId: UUID; name: string; foodType?: FoodType; quantity?: number }>;
}

/** Meal-specific planner history entry (combo or single item). */
export type MenuHistoryEntryType = 'COMBO' | 'ITEM';

export interface MenuHistoryItemResponse {
  historyId: UUID;
  type: MenuHistoryEntryType;
  mealType: MealType;
  name: string;
  thumbnailUrl?: string | null;
  foodType?: FoodType | null;
  summary?: string | null;
  lastUsedAt: string;
  lastUsedMenuDate?: string | null;
  usageCount: number;
  price?: number | null;
  currencyCode?: string | null;
  comboId?: UUID | null;
  itemId?: UUID | null;
  itemIds?: UUID[] | null;
}

export interface MenuHistoryPageResponse {
  items: MenuHistoryItemResponse[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface DailyMenuOptionResponse {
  optionId?: UUID;
  entryType?: DailyMenuEntryType;
  comboId?: UUID | null;
  itemId?: UUID | null;
  label: string;
  sortOrder: number;
  isAvailable: boolean;
  /** Mess-only add-on; same catalog item may also appear as a main dish. */
  isExtra?: boolean;
  price?: number | null;
  currencyCode?: string | null;
  packageItems?: Array<{ itemId: UUID; name: string }> | null;
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
    optionId?: UUID;
    entryType?: DailyMenuEntryType;
    comboId?: UUID | null;
    itemId?: UUID | null;
    /** Required when entryType = 'PACKAGE' */
    itemIds?: UUID[] | null;
    label: string;
    sortOrder: number;
    isAvailable: boolean;
    /** Mess-only add-on flag for PACKAGE entries. */
    isExtra?: boolean;
    price?: number | null;
    currencyCode?: string | null;
  }>;
  notes?: string | null;
}

export interface CreateMealPlanRequest {
  name: string;
  breakfastIncluded: boolean;
  lunchIncluded: boolean;
  dinnerIncluded: boolean;
}

export interface CreateMealParticipationRequest {
  memberId: UUID;
  mealPlanId: UUID;
  effectiveFrom: string;
  effectiveTo?: string | null;
  defaultDeliveryLocationId?: UUID | null;
}

export interface UpdateMealParticipationRequest {
  mealPlanId?: UUID;
  status?: MealParticipationStatus;
  defaultDeliveryLocationId?: UUID | null;
}

export interface MealParticipationSearchParams {
  status?: MealParticipationStatus;
  mealPlanCode?: MealPlanCode;
  search?: string;
}

export interface MealEligibilitySummaryResponse {
  date: string;
  distinctEligibleMemberCount: number;
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
  price?: number | null;
  currencyCode?: string | null;
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

export type MealPollStatus = 'OPEN' | 'CLOSED';
export type MealPollOptionType = 'MENU_ENTRY' | 'NOT_AVAILABLE';

export interface MealPollOption {
  id: UUID;
  optionType: MealPollOptionType;
  sortOrder: number;
  label: string;
  detail?: string | null;
  dailyMenuEntryId?: UUID | null;
  price?: number | null;
  currencyCode?: string | null;
  foodType?: FoodType | null;
  /** Mess-only add-on from daily menu extras. */
  isExtra?: boolean;
}

export type MealPollCloseSource = 'MANUAL' | 'AUTOMATIC';
export type PollCloseDayOffset = 'PREVIOUS_DAY' | 'SAME_DAY';

export interface MealPollSlot {
  id: UUID;
  pollDate: string;
  mealType: MealType;
  status: MealPollStatus;
  dailyMenuId: UUID;
  options: MealPollOption[];
  mySelectedOptionId?: UUID | null;
  mySelections?: MealPollMySelection[];
  multiQuantityEnabled?: boolean;
  responseCount: number;
  myDeliveryLocationId?: UUID | null;
  myDeliveryLocationName?: string | null;
  timezone?: string | null;
  pollCloseAt?: string | null;
  closedAt?: string | null;
  openedAt?: string | null;
  closeSource?: MealPollCloseSource | null;
}

export interface MealPollClosingSettings {
  timezone: string;
  breakfastDayOffset: PollCloseDayOffset;
  breakfastTime: string;
  lunchDayOffset: PollCloseDayOffset;
  lunchTime: string;
  dinnerDayOffset: PollCloseDayOffset;
  dinnerTime: string;
}

export interface UpdateMealPollClosingSettingsRequest {
  timezone: string;
  breakfastDayOffset: PollCloseDayOffset;
  breakfastTime: string;
  lunchDayOffset: PollCloseDayOffset;
  lunchTime: string;
  dinnerDayOffset: PollCloseDayOffset;
  dinnerTime: string;
}

export interface MealDeliveryLocation {
  id: UUID;
  name: string;
  description?: string | null;
  address?: string | null;
  active: boolean;
  sortOrder: number;
}

export interface MealPollMySelection {
  optionId: UUID;
  quantity: number;
}

export type MealPollPaymentChoice = 'MARK_AS_PAID' | 'PAY_LATER';
export type MealPollPaymentStatus = 'PENDING' | 'PENDING_APPROVAL' | 'PAID' | 'REJECTED';

export interface MealPollDayResponse {
  pollDate: string;
  polls: MealPollSlot[];
  myPaymentStatus?: MealPollPaymentStatus | null;
  myPaymentChoice?: MealPollPaymentChoice | null;
  myProofImageUrl?: string | null;
  myRejectionReason?: string | null;
  deliveryLocations?: MealDeliveryLocation[];
  myLastDeliveryLocationIds?: Partial<Record<MealType, UUID>>;
  myMealBillingType?: MealBillingType | null;
  myPrepaidOverflowAmount?: number | null;
  myPrepaidDebitedAmount?: number | null;
  myPrepaidOverflowPayment?: boolean | null;
  /** Persisted meal total for this member/day. */
  myPaymentChargedAmount?: number | null;
  /** Ephemeral delta from this submit only (Paid edits). Not stored. */
  myPaymentAdjustment?: number | null;
}

export type MealPollPaymentEventType =
  | 'PAY_LATER_SELECTED'
  | 'MARK_AS_PAID_SELECTED'
  | 'PROOF_SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REMINDER_SENT'
  | 'PREPAID_OVERFLOW_PAY_LATER';

export interface MealPollPaymentEvent {
  eventId: UUID;
  pollDate: string;
  eventType: MealPollPaymentEventType;
  paymentStatus?: MealPollPaymentStatus | null;
  paymentChoice?: MealPollPaymentChoice | null;
  amount?: number | null;
  remarks?: string | null;
  actorId?: UUID | null;
  createdAt: string;
}

export interface SubmitMealPollOptionQuantity {
  optionId: UUID;
  quantity: number;
}

export interface SubmitMealPollSelection {
  mealType: MealType;
  selectedOptionId?: UUID;
  options?: SubmitMealPollOptionQuantity[];
  deliveryLocationId?: UUID;
}

export interface MealHeadcountMember {
  memberId: UUID;
  memberName: string;
  quantity?: number;
  paymentStatus?: MealPollPaymentStatus | null;
  paymentProofImageUrl?: string | null;
  deliveryLocationId?: UUID | null;
  deliveryLocationName?: string | null;
}

export interface MealHeadcountOption {
  optionId: UUID;
  optionType: MealPollOptionType;
  sortOrder: number;
  label: string;
  detail?: string | null;
  price?: number | null;
  currencyCode?: string | null;
  count: number;
  members: MealHeadcountMember[];
}

export interface MealHeadcountSlot {
  mealType: MealType;
  pollId: UUID;
  pollStatus: MealPollStatus;
  mealsToPrepare: number;
}

export interface MealHeadcountDayResponse {
  date: string;
  slots: MealHeadcountSlot[];
}

export interface MealHeadcountDetailResponse {
  date: string;
  mealType: MealType;
  pollId: UUID;
  pollStatus: MealPollStatus;
  mealsToPrepare: number;
  eligibleCount: number;
  options: MealHeadcountOption[];
  noResponseMembers: MealHeadcountMember[];
  deliveryBreakdown?: MealHeadcountDeliveryLocation[];
}

export interface MealHeadcountDeliveryLocation {
  locationId: UUID;
  locationName: string;
  totalPlates: number;
}

export interface MemberMealParticipationSummary {
  participationId: UUID;
  mealPlanId: UUID;
  mealPlanCode: MealPlanCode;
  mealPlanName: string;
  status: MealParticipationStatus;
  effectiveFrom: string;
  effectiveTo?: string | null;
  defaultDeliveryLocationId?: UUID | null;
  defaultDeliveryLocationName?: string | null;
}

export type MemberMealActivitySlotStatus =
  | 'ACCEPTED'
  | 'PENDING'
  | 'SKIPPED'
  | 'NO_MENU'
  | 'INACTIVE';

export interface MemberMealActivitySlot {
  mealType: MealType;
  status: MemberMealActivitySlotStatus;
  selectionLabel?: string | null;
  quantity?: number | null;
  deliveryLocationName?: string | null;
  slotAmount?: number | null;
  currencyCode?: string | null;
}

export interface MemberMealActivityDay {
  date: string;
  hasActivity?: boolean;
  dayTotal?: number | null;
  currencyCode?: string | null;
  paymentStatus?: MealPollPaymentStatus | null;
  /** Immutable human payment reference when available (e.g. PAY-20260720-000123). */
  paymentReference?: string | null;
  paymentBatchId?: string | null;
  slots: MemberMealActivitySlot[];
}

export interface MemberMealActivitySummary {
  acceptedMeals: number;
  pendingResponses: number;
  skippedMeals: number;
  amountGenerated?: number | null;
  paidAmount?: number | null;
  pendingAmount?: number | null;
  currencyCode?: string | null;
  balanceRemaining?: number | null;
  balancePurchased?: number | null;
  balanceConsumed?: number | null;
  amountPaidThisMonth?: number | null;
  balanceUnit?: PrepaidBalanceUnit | null;
}

export interface MemberMealBalance {
  balance: number;
  unit: PrepaidBalanceUnit;
  currencyCode: string;
  purchasedThisMonth?: number | null;
  consumedThisMonth?: number | null;
  amountPaidThisMonth?: number | null;
  lastPurchaseMeals?: number | null;
  lastPurchasePaidAmount?: number | null;
  currentAmountPaid?: number | null;
  lastPurchaseAt?: string | null;
  mealsIncluded?: number | null;
  mealsUsed?: number | null;
  mealsRemaining?: number | null;
  validTill?: string | null;
  active?: boolean;
  endedAt?: string | null;
  endedBy?: UUID | null;
}

export type MealSubscriptionAction = 'CREATED' | 'UPDATED' | 'RENEWED' | 'MEALS_ADDED' | 'ENDED';

export type MemberMealBalanceActivityEventType = 'PURCHASE' | 'DEBIT' | 'ENDED';

export interface MemberMealBalanceActivityEvent {
  eventId: UUID;
  eventType: MemberMealBalanceActivityEventType;
  meals?: number | null;
  paidAmount?: number | null;
  mealType?: MealType | null;
  pollDate?: string | null;
  remarks?: string | null;
  balanceAfter?: number | null;
  createdAt: string;
  subscriptionAction?: MealSubscriptionAction | null;
}

export interface MemberSubscriptionLifetimeSummary {
  totalMealsPurchased?: number | null;
  totalMealsConsumed?: number | null;
  totalAmountPaid?: number | null;
  totalActivities?: number | null;
}

export interface MemberSubscriptionHistoryResponse {
  summary: MemberSubscriptionLifetimeSummary;
  events: MemberMealBalanceActivityEvent[];
}

export interface RecordMealBalancePurchaseRequest {
  amount: number;
  paidAmount?: number;
  remarks?: string;
  replaceBalance?: boolean;
  validTill?: string;
}

export interface MemberMealActivityMonth {
  month: string;
  summary: MemberMealActivitySummary;
  days: MemberMealActivityDay[];
}

export interface MemberMealActivitySelection {
  label: string;
  price?: number | null;
  currencyCode?: string | null;
  quantity: number;
  itemDetail?: string | null;
  lineTotal?: number | null;
}

export interface MemberMealActivityDayPayment {
  id?: UUID | null;
  pollDate?: string | null;
  paymentChoice?: MealPollPaymentChoice | null;
  paymentStatus?: MealPollPaymentStatus | null;
  chargedAmount?: number | null;
  paymentBatchId?: string | null;
  /**
   * Immutable human-readable payment reference (e.g. PAY-20260720-000123).
   * Minted once on first submission; never regenerate.
   */
  paymentReference?: string | null;
  proofImageUrl?: string | null;
  /** Customer/UTR transaction reference entered with proof (not the system payment reference). */
  referenceNumber?: string | null;
  remarks?: string | null;
  paymentMethod?: UniversalPaymentMethod | null;
  rejectionReason?: string | null;
  proofSubmittedAt?: string | null;
  proofReviewedAt?: string | null;
  prepaidOverflowAmount?: number | null;
  prepaidDebitedAmount?: number | null;
  prepaidOverflowPayment?: boolean;
}

export interface BulkMealPollPaymentProofResponse {
  paymentBatchId: string;
  /** Immutable human-readable reference for the submitted payment batch. */
  paymentReference?: string | null;
  dates: string[];
  updatedCount: number;
}

export interface MemberMealActivitySlotDetail {
  mealType: MealType;
  status: MemberMealActivitySlotStatus;
  menuPublished: boolean;
  pollStatus?: MealPollStatus | null;
  deliveryLocationName?: string | null;
  deliveryLocationDescription?: string | null;
  respondedAt?: string | null;
  slotTotal?: number | null;
  selections: MemberMealActivitySelection[];
}

export interface MemberMealActivityDailyCharge {
  mealType: MealType;
  amount?: number | null;
  currencyCode?: string | null;
}

export interface MemberMealActivitySubscription {
  planName?: string | null;
  creditsConsumed?: number | null;
  creditsRemaining?: number | null;
  coveredBySubscription?: boolean;
}

export interface MemberMealActivityDayDetail {
  date: string;
  memberName?: string | null;
  hasActivity?: boolean;
  responseSubmittedAt?: string | null;
  dayTotal?: number | null;
  currencyCode?: string | null;
  payment?: MemberMealActivityDayPayment | null;
  subscription?: MemberMealActivitySubscription | null;
  notes?: string | null;
  dailyCharges?: MemberMealActivityDailyCharge[];
  slots: MemberMealActivitySlotDetail[];
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
  genderPolicy?: GenderPolicy | null;
  amenities?: AmenityAssignment[];
}

export interface CreateMemberRequest {
  fullName: string;
  mobileNumber: string;
  role: MembershipRole;
  gender?: MemberGender | null;
  mealBillingType?: MealBillingType | null;
}

export interface UpdateMemberRequest {
  fullName: string;
  mobileNumber: string;
  role: MembershipRole;
  gender?: MemberGender | null;
  mealBillingType?: MealBillingType | null;
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
  membershipId?: UUID | null;
  status: MemberStatus;
  occupancyStatus?: MemberOccupancyStatus;
  gender?: MemberGender | null;
  createdAt: string;
}

/** Eligible resident for cross-space Move In / Reserve reuse. */
export interface MemberImportCandidateResponse {
  memberId: UUID;
  fullName: string;
  mobileNumber: string;
  role: MembershipRole;
  status: MemberStatus;
  occupancyStatus?: MemberOccupancyStatus;
  gender?: MemberGender | null;
  createdAt: string;
  sourceSpaceId: UUID;
  sourceSpaceName: string;
  alreadyInTargetSpace: boolean;
  availableForMoveIn: boolean;
}

export interface ImportMemberRequest {
  sourceMemberId: UUID;
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
  gender?: MemberGender | null;
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
  mealBillingType?: MealBillingType | null;
  effectiveMealBillingType?: MealBillingType;
  assignedAmenities?: AmenityAssignment[];
  createdAt: string;
  updatedAt: string;
  linkedUserProfile?: UserResponse | null;
}

export interface PendingInvitationResponse {
  invitationId: UUID;
  mobileNumber: string;
  role: MembershipRole;
  status: InvitationStatus;
  invitedBy: string;
  createdAt: string;
}

export interface MyInvitationResponse {
  invitationId: UUID;
  spaceId: UUID;
  spaceName: string;
  spaceType: SpaceType;
  role: MembershipRole;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
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
  mealBillingType?: MealBillingType;
  prepaidBalanceUnit?: PrepaidBalanceUnit | null;
  prepaidFallbackToPayPerMeal?: boolean;
  genderPolicy?: GenderPolicy | null;
  amenities?: AmenityAssignment[];
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
  genderPolicy?: GenderPolicy | null;
  amenities?: AmenityAssignment[];
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

export type OtpPurpose = 'REGISTER' | 'ACCOUNT_DELETION';

export interface SendOtpRequest {
  mobileNumber: string;
  purpose: OtpPurpose;
}

export interface SendOtpResponse {
  mobileNumber: string;
  purpose: OtpPurpose;
  expiresIn: number;
  resendAfter: number;
  message: string;
}

export interface VerifyOtpRequest {
  mobileNumber: string;
  otp: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpResponse {
  verified: boolean;
  verificationToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  mobileNumber: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  /** Optional. Reserved for future OTP-verified registration. */
  verificationToken?: string;
}

export interface PasswordAccountDeletionRequest {
  mobileNumber: string;
  password: string;
}

export interface UserResponse {
  id: UUID;
  mobileNumber: string;
  fullName: string;
  profilePhotoUrl?: string | null;
  active: boolean;
  createdAt: string;
  email?: string | null;
  gender?: MemberGender | null;
  dateOfBirth?: string | null;
  permanentAddress?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  profileCompleted?: boolean;
  profileCompletedAt?: string | null;
  profileStatus?: ProfileStatus | null;
  profileCompletionPercentage?: number | null;
  documentsUploaded?: number | null;
  kycStatus?: KycStatus | null;
}

export type ProfileStatus =
  | 'PENDING'
  | 'PARTIAL'
  | 'COMPLETED'
  | 'UNDER_REVIEW'
  | 'VERIFIED';

export type KycStatus = 'NOT_STARTED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface UpdateUserRequest {
  fullName: string;
}

export interface CompleteUserProfileRequest {
  fullName: string;
  gender?: MemberGender | null;
  dateOfBirth?: string | null;
  email?: string | null;
  profilePhotoUrl?: string | null;
  permanentAddress: string;
  city: string;
  state: string;
  pincode: string;
  emergencyContactName?: string | null;
  emergencyContactMobile?: string | null;
  emergencyContactRelation?: string | null;
  identityDocumentType?: MemberDocumentType | null;
  identityDocumentNumber?: string | null;
  addressProofFileUrl?: string | null;
  identityProofFileUrl?: string | null;
  additionalDocumentFileUrl?: string | null;
  profileCompleted?: boolean;
  profileStatus?: ProfileStatus;
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
  status?: AccommodationStatus;
  includeInactive?: boolean;
  buildingId?: UUID;
  floorId?: UUID;
  unitId?: UUID;
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
  active?: boolean;
}

export interface UnitListItemResponse {
  unitId: UUID;
  name: string;
  roomCount: number;
  bedCount: number;
  availableBeds?: number;
  occupiedBeds?: number;
  status: AccommodationStatus;
  synthetic: boolean;
  unitKind?: UnitKind | null;
  active?: boolean;
}

export interface RoomListItemResponse {
  roomId: UUID;
  name: string;
  roomType: RoomType;
  bedCount: number;
  availableBeds: number;
  occupiedBeds: number;
  active?: boolean;
}

export interface BedListItemResponse {
  bedId: UUID;
  label: string;
  status: AccommodationStatus;
  active?: boolean;
}

export interface BedSpaceListItemResponse {
  bedId: UUID;
  label: string;
  status: AccommodationStatus;
  buildingId: UUID;
  buildingName: string;
  floorId?: UUID | null;
  floorName?: string | null;
  unitId?: UUID | null;
  unitName?: string | null;
  roomId: UUID;
  roomName: string;
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
  amenities?: AmenityAssignment[];
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
  foodIncludedInRent?: boolean;
  otherCharges?: OccupancyChargeLine[];
  createMealParticipation?: boolean;
  amenities?: AmenityAssignment[];
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
  foodIncludedInRent?: boolean;
  otherCharges?: OccupancyChargeLine[];
  createMealParticipation?: boolean;
  amenities?: AmenityAssignment[];
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
  foodIncludedInRent?: boolean;
  otherCharges?: OccupancyChargeLine[];
  amenities?: AmenityAssignment[];
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

export type DashboardFinancialSource = 'API' | 'MEAL_ACTIVITY' | 'OCCUPANCY' | 'HYBRID';

export interface DashboardFinancialSummary {
  expectedCharges: number | null;
  collected: number | null;
  /** Submitted proofs awaiting owner review — excluded from pending. */
  underReview?: number | null;
  pending: number | null;
  currencyCode: string;
  source?: DashboardFinancialSource;
  mealBillingType?: MealBillingType;
  prepaidBalance?: PrepaidBalanceSummary | null;
  mixedMealBilling?: boolean | null;
}

export interface DashboardMessOperations {
  membersReceivingMeals: number;
  menusPublishedThisMonth: number;
  openPollsCount: number;
  todaysHeadcount: number | null;
  pollRespondedCount: number;
  pollEligibleCount: number;
}

export interface DashboardAccommodationOperations {
  occupiedBeds: number;
  vacantBeds: number;
  moveInsThisMonth: number;
  pendingPaymentsCount: number;
}

export type DashboardAttentionKind =
  | 'not_planned'
  | 'partial_planned'
  | 'ready_to_share'
  | 'poll_open'
  | 'payments_overdue'
  | 'subscription_activation_pending';

export interface DashboardAttentionItem {
  kind: DashboardAttentionKind;
  scheduledCount?: number;
  totalMeals?: number;
  missingMealTypes?: MealType[];
  respondedCount?: number;
  eligibleCount?: number;
  openPollCount?: number;
  overdueCount?: number;
  overdueAmount?: number | null;
  currencyCode?: string;
  pendingSubscriptionRequestCount?: number;
}

export interface DashboardSummaryResponse {
  spaceType: SpaceType;
  month: string;
  financial: DashboardFinancialSummary;
  messOperations?: DashboardMessOperations | null;
  accommodationOperations?: DashboardAccommodationOperations | null;
  attention: DashboardAttentionItem[];
  pendingActions?: PendingActionsSummary | null;
}

export type NotificationType =
  | 'PAYMENT_NEEDS_REVIEW'
  | 'PAYMENT_NEEDS_UPDATE'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_REJECTED'
  | 'PAYMENT_UPDATE_REQUESTED'
  | 'MEAL_POLL_NOT_PUBLISHED'
  | 'MEAL_RESPONSES_BELOW_THRESHOLD'
  | 'MENU_NOT_PLANNED'
  | 'MENU_DRAFT_PENDING_PUBLISH'
  | 'SUBSCRIPTION_ACTIVATION_PENDING'
  | 'MEAL_POLL_PUBLISHED'
  | 'MEAL_POLL_REMINDER'
  | 'RESERVATION_STARTING_TODAY'
  | 'MOVE_IN_SCHEDULED_TODAY'
  | 'MOVE_OUT_SCHEDULED_TODAY'
  | 'VACANT_RESERVED_BED'
  | 'EXPIRED_RESERVATION'
  | 'RESERVATION_CREATED'
  | 'MOVE_IN_COMPLETED'
  | 'MOVE_OUT_COMPLETED'
  | 'PENDING_INVITATION'
  | 'TENANT_PROFILE_INCOMPLETE'
  | 'MISSING_KYC_DOCUMENTS'
  | 'MISSING_ADDRESS_PROOF'
  | 'INVITATION_ACCEPTED'
  | 'TENANT_PROFILE_COMPLETED'
  | 'COMPLAINT_PENDING'
  | 'COMPLAINT_OVERDUE'
  | 'COMPLAINT_CREATED'
  | 'COMPLAINT_COMMENTED'
  | 'COMPLAINT_RESOLVED';

export type NotificationCategory =
  | 'INFORMATION'
  | 'SUCCESS'
  | 'WARNING'
  | 'ACTION_REQUIRED'
  | 'ERROR';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type NotificationStatus = 'UNREAD' | 'READ' | 'RESOLVED' | 'DISMISSED';

export interface SpaceNotification {
  notificationId: UUID;
  spaceId: UUID;
  organizationId?: UUID | null;
  userId: UUID;
  actorId?: UUID | null;
  entityType: string;
  entityId?: UUID | null;
  notificationType: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message?: string | null;
  actionLabel?: string | null;
  actionRoute?: string | null;
  status: NotificationStatus;
  readAt?: string | null;
  resolvedAt?: string | null;
  deliveryChannels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PendingActionGroup {
  actionType: NotificationType;
  title: string;
  actionLabel?: string | null;
  actionRoute?: string | null;
  priority: NotificationPriority;
  count: number;
  items: SpaceNotification[];
}

export interface PendingActionsSummary {
  totalCount: number;
  groups: PendingActionGroup[];
}

export interface GlobalAttentionItem {
  actionType: NotificationType;
  title: string;
  message?: string | null;
  count: number;
  priority: NotificationPriority;
  actionLabel?: string | null;
  actionRoute?: string | null;
  sampleEntityId?: UUID | null;
}

export interface GlobalAttentionSpace {
  spaceId: UUID;
  spaceName: string;
  spaceType?: SpaceType | string | null;
  count: number;
  items: GlobalAttentionItem[];
}

export interface GlobalActivityItem {
  notificationId: UUID;
  spaceId: UUID;
  spaceName?: string | null;
  notificationType: NotificationType;
  category: NotificationCategory;
  title: string;
  message?: string | null;
  actionRoute?: string | null;
  entityId?: UUID | null;
  createdAt: string;
}

export interface GlobalSpaceStatus {
  spaceId: UUID;
  spaceName: string;
  spaceType?: SpaceType | string | null;
  membershipRole: MembershipRole | string;
  pendingActionCount: number;
  needsAttention: boolean;
}

export interface GlobalDashboardResponse {
  totalAttentionCount: number;
  unreadNotificationCount: number;
  attentionRequired: GlobalAttentionSpace[];
  attentionHasMore: boolean;
  recentActivity: GlobalActivityItem[];
  activityHasMore: boolean;
  spaceSummaries: GlobalSpaceStatus[];
}

export type MemberPaymentStatus =
  | 'PAID'
  | 'PARTIAL'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'UPDATE_REQUESTED'
  | 'REJECTED'
  | 'NONE';

export interface MemberPaymentLedgerRow {
  memberId: UUID;
  memberName: string;
  expectedCharges: number | null;
  collected: number | null;
  underReview?: number | null;
  pending: number | null;
  currencyCode: string;
  status: MemberPaymentStatus;
  mealBillingType?: MealBillingType;
  mealBalanceRemaining?: number | null;
  mealBalancePurchased?: number | null;
  mealBalanceConsumed?: number | null;
  mealBalanceUnit?: PrepaidBalanceUnit | null;
}

export interface MemberPaymentLedgerResponse {
  month: string;
  spaceType: SpaceType;
  summary: DashboardFinancialSummary;
  members: MemberPaymentLedgerRow[];
}

export interface SubscriptionPlanResponse {
  planId: UUID;
  name: string;
  mealsIncluded: number;
  price: number;
  currencyCode: string;
  validityDays: number;
  carryForwardUnused: boolean;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export type SubscriptionActivationRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface SubscriptionActivationRequestResponse {
  requestId: UUID;
  memberId: UUID;
  memberName: string;
  planId: UUID;
  planName: string;
  status: SubscriptionActivationRequestStatus;
  paymentReference?: string | null;
  paymentProofImageUrl?: string | null;
  customerNotes?: string | null;
  ownerNotes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export type CustomerSubscriptionLifecycleStatus =
  | 'none'
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'ended'
  | 'pay_per_meal';

export interface CustomerSubscriptionStatusResponse {
  mealBillingType?: MealBillingType;
  prepaidBilling: boolean;
  subscriptionActive: boolean;
  lifecycleStatus: CustomerSubscriptionLifecycleStatus;
  validTill?: string | null;
  endedAt?: string | null;
  mealsRemaining?: number | null;
  pendingActivationStatus?: SubscriptionActivationRequestStatus | null;
  pendingActivationRequestId?: UUID | null;
  pendingPlanName?: string | null;
}

export interface CreateSubscriptionPlanRequest {
  name: string;
  mealsIncluded: number;
  price: number;
  currencyCode?: string;
  validityDays: number;
  carryForwardUnused?: boolean;
  description?: string;
  sortOrder?: number;
}

export interface UpdateSubscriptionPlanRequest extends CreateSubscriptionPlanRequest {
  active?: boolean;
}

export interface CreateSubscriptionActivationRequest {
  planId: UUID;
  paymentReference?: string;
  proofImageBase64?: string;
  customerNotes?: string;
}

// ─── Universal payment collection (SpacePayment) ────────────────────────────

export type UniversalPaymentType = 'MEAL' | 'RENT' | 'DEPOSIT' | 'MAINTENANCE' | 'OTHER';

export type UniversalPaymentMethod = 'UPI' | 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'OTHER';

/**
 * PENDING → (proof upload) → UNDER_REVIEW → PAID | REJECTED | UPDATE_REQUESTED
 * PROOF_UPLOADED may appear transiently before UNDER_REVIEW.
 * UPDATE_REQUESTED → tenant resubmits → UNDER_REVIEW
 */
export type UniversalPaymentStatus =
  | 'PENDING'
  | 'PROOF_UPLOADED'
  | 'UNDER_REVIEW'
  | 'PAID'
  | 'REJECTED'
  | 'UPDATE_REQUESTED';

/** Reporting sub-category; valid combinations depend on paymentType. */
export type PaymentCategory =
  | 'MONTHLY'
  | 'DAILY'
  | 'EXTRA'
  | 'ADVANCE'
  | 'SECURITY'
  | 'REFUND'
  | 'ELECTRICITY'
  | 'WATER'
  | 'INTERNET'
  | 'OTHER';

export type PaymentRejectionReason =
  | 'PAYMENT_AMOUNT_MISMATCH'
  | 'WRONG_SCREENSHOT'
  | 'INVALID_UTR'
  | 'OTHER';

export type PaymentTimelineEventType =
  | 'CREATED'
  | 'PROOF_UPLOADED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMITTED'
  | 'PAID'
  | 'REFUNDED'
  | 'UPDATE_REQUESTED';

export interface SpacePaymentResponse {
  paymentId: UUID;
  spaceId: UUID;
  memberId: UUID;
  memberName: string;
  occupancyId?: UUID | null;
  paymentType: UniversalPaymentType;
  paymentCategory: PaymentCategory;
  title: string;
  amount: number;
  currencyCode: string;
  dueDate: string;
  month: string;
  paymentMethod?: UniversalPaymentMethod | null;
  paymentStatus: UniversalPaymentStatus;
  proofUrl?: string | null;
  referenceNumber?: string | null;
  remarks?: string | null;
  rejectionReason?: string | null;
  rejectionCode?: PaymentRejectionReason | null;
  reviewedBy?: UUID | null;
  reviewedAt?: string | null;
  paymentDate?: string | null;
  targetLabel?: string | null;
  /** Present when multiple meal days were paid with one bulk proof. */
  paymentBatchId?: string | null;
  /**
   * Immutable human-readable payment reference (e.g. PAY-20260720-000123).
   * Prefer this over paymentBatchId / paymentId for customer and owner display.
   */
  paymentReference?: string | null;
  /** Meal day dates covered by this payment (what was paid). */
  mealDates?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpacePaymentListResponse {
  month: string;
  payments: SpacePaymentResponse[];
}

export interface OwnerPaymentsMonthCounts {
  pendingReview: number;
  submitted: number;
  changesRequested: number;
  paid: number;
  rejected: number;
  history: number;
  pendingMembers: number;
}

/** Aggregated owner Payments screen payload (legacy / deprecated). Prefer split APIs. */
export interface OwnerPaymentsMonthResponse {
  month: string;
  spaceType: SpaceType;
  summary: DashboardFinancialSummary;
  members: MemberPaymentLedgerRow[];
  payments: SpacePaymentResponse[];
  counts: OwnerPaymentsMonthCounts;
}

/** Lightweight Payments KPIs + tab counts. */
export interface PaymentsSummaryResponse {
  month: string;
  spaceType: SpaceType;
  financial: DashboardFinancialSummary;
  counts: OwnerPaymentsMonthCounts;
}

export interface PaymentsMembersPageResponse {
  month: string;
  page: PagedResponse<MemberPaymentLedgerRow>;
}

export type PaymentsReviewQueueParam =
  | 'SUBMITTED'
  | 'NEEDS_UPDATE'
  | 'PENDING_REVIEW'
  | 'PAID'
  | 'REJECTED'
  | 'HISTORY';

export interface PaymentsCardsPageResponse {
  month: string;
  queue: PaymentsReviewQueueParam | string;
  page: PagedResponse<SpacePaymentResponse>;
}

export interface PaymentTimelineEventResponse {
  eventId: UUID;
  paymentId: UUID;
  eventType: PaymentTimelineEventType;
  performedAt: string;
  remarks?: string | null;
  performedBy?: UUID | null;
}

export interface PaymentTimelineResponse {
  paymentId: UUID;
  events: PaymentTimelineEventResponse[];
}

export interface ListSpacePaymentsParams {
  month?: string;
  status?: UniversalPaymentStatus;
  memberId?: UUID;
  paymentType?: UniversalPaymentType;
  paymentCategory?: PaymentCategory;
  /** When false, skips server-side expected-payment sync (faster read for badges). */
  sync?: boolean;
}

export interface SubmitPaymentProofRequest {
  proofImageBase64?: string;
  referenceNumber?: string;
  remarks?: string;
  paymentMethod?: UniversalPaymentMethod;
}

export type PaymentReviewAction = 'APPROVE' | 'REJECT' | 'REQUEST_UPDATE';

export interface ReviewPaymentRequest {
  action: PaymentReviewAction;
  remarks?: string;
  rejectionCode?: PaymentRejectionReason;
}

/** @deprecated Use ReviewPaymentRequest via POST /review */
export interface ApprovePaymentRequest {
  remarks?: string;
}

/** @deprecated Use ReviewPaymentRequest via POST /review */
export interface RejectPaymentRequest {
  rejectionCode: PaymentRejectionReason;
  rejectionReason?: string;
}

export type ComplaintStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintCategory =
  | 'MAINTENANCE'
  | 'HOUSEKEEPING'
  | 'FOOD'
  | 'FOOD_QUALITY'
  | 'FOOD_SERVICE'
  | 'BILLING'
  | 'SAFETY'
  | 'SERVICE'
  | 'OTHER';

export type ComplaintTimelineEventType =
  | 'CREATED'
  | 'STATUS_CHANGED'
  | 'COMMENTED'
  | 'INTERNAL_NOTE'
  | 'ATTACHMENT_ADDED'
  | 'ASSIGNED'
  | 'PRIORITY_CHANGED'
  | 'REOPENED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export interface ComplaintTimelineEvent {
  eventId: UUID;
  eventType: ComplaintTimelineEventType;
  performedAt: string;
  remarks?: string | null;
  performedBy?: UUID | null;
}

export interface ComplaintComment {
  commentId: UUID;
  authorMemberId?: UUID | null;
  authorName?: string | null;
  authorUserId: UUID;
  body: string;
  internal: boolean;
  createdAt: string;
}

export interface ComplaintAttachment {
  attachmentId: UUID;
  storageUrl: string;
  contentType?: string | null;
  fileName?: string | null;
  createdByUserId: UUID;
  createdAt: string;
}

export interface ComplaintResponse {
  complaintId: UUID;
  spaceId: UUID;
  createdByMemberId: UUID;
  createdByMemberName?: string | null;
  createdByUserId: UUID;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  title: string;
  description: string;
  assignedToMembershipId?: UUID | null;
  assignedToName?: string | null;
  resolutionSummary?: string | null;
  resolvedAt?: string | null;
  resolvedByUserId?: UUID | null;
  reopenedAt?: string | null;
  closedAt?: string | null;
  cancelledAt?: string | null;
  mealDate?: string | null;
  mealType?: MealType | null;
  createdAt: string;
  updatedAt: string;
  canReopen: boolean;
  comments?: ComplaintComment[] | null;
  attachments?: ComplaintAttachment[] | null;
  timeline?: ComplaintTimelineEvent[] | null;
}

export interface ComplaintListResponse {
  totalCount: number;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  complaints: ComplaintResponse[];
}

export interface ListComplaintsParams {
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  category?: ComplaintCategory;
  assigneeMembershipId?: UUID;
  mine?: boolean;
}

export interface CreateComplaintRequest {
  category: ComplaintCategory;
  priority: ComplaintPriority;
  title: string;
  description: string;
  mealDate?: string;
  mealType?: MealType;
  attachmentImagesBase64?: string[];
}

export interface UpdateComplaintStatusRequest {
  status: ComplaintStatus;
  note?: string;
}

export interface AddComplaintCommentRequest {
  body: string;
  internal?: boolean;
}

export interface AddComplaintAttachmentRequest {
  imageBase64: string;
  fileName?: string;
  contentType?: string;
}

export interface AssignComplaintRequest {
  assigneeMembershipId?: UUID | null;
}

export interface UpdateComplaintResolutionRequest {
  resolutionSummary: string;
  markResolved?: boolean;
}

export interface ReopenComplaintRequest {
  reason?: string;
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
