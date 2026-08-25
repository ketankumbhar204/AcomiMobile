import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MembershipRole, OtpPurpose, UUID } from '../api/types';

export type OtpVerificationParams = {
  mobileNumber: string;
  purpose?: OtpPurpose;
};

export type AuthStackParamList = {
  Login: { accountDeleted?: boolean } | undefined;
  Register: undefined;
  OtpVerification: OtpVerificationParams;
  RegisterPassword: {
    mobileNumber: string;
  };
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

export type SpaceTabParamList = {
  Dashboard: { spaceId: UUID };
  Members: { spaceId: UUID };
  Accommodation: { spaceId: UUID };
  Meals: { spaceId: UUID };
  Payments: {
    spaceId: UUID;
    initialFilter?: 'all' | 'pending' | 'collected' | 'underReview';
    initialSection?:
      | 'members'
      | 'pendingReview'
      | 'history'
      | 'submitted'
      | 'changesRequested'
      | 'paid'
      | 'rejected';
  };
  Complaints: { spaceId: UUID };
};

export type AccommodationFormMode = 'create' | 'edit';

export type MainStackParamList = {
  MySpaces: undefined;
  OnboardingChoice: undefined;
  JoinSpace: undefined;
  AcceptInvitations: undefined;
  ProfileCompletionGate: undefined;
  CompleteProfile: { mode?: 'onboarding' | 'edit' } | undefined;
  Profile: undefined;
  DeleteAccount: undefined;
  DeleteAccountOtp: OtpVerificationParams;
  CreateSpace: undefined;
  SpaceDetails: { spaceId: UUID };
  EditSpace: { spaceId: UUID };
  /** Parent space id + optional nested tab target (soft navigate; avoid CommonActions.reset). */
  SpaceTabs: { spaceId: UUID } & NavigatorScreenParams<SpaceTabParamList>;
  InviteMembers: {
    spaceId: UUID;
    mobileNumber?: string;
    role?: MembershipRole;
    memberName?: string;
  };
  AddMember: { spaceId: UUID; initialMode?: 'new' | 'search' };
  AddCustomersHub: { spaceId: UUID };
  ImportExistingPeople: { spaceId: UUID };
  MemberDetails: { spaceId: UUID; memberId: UUID };
  MemberOccupancyHistory: { spaceId: UUID; memberId: UUID; memberName: string };
  EditMember: { spaceId: UUID; memberId: UUID };
  MemberSubscription: {
    spaceId: UUID;
    memberId: UUID;
    action: 'create' | 'edit' | 'renew';
  };
  MemberSubscriptionHistory: { spaceId: UUID; memberId: UUID };
  Floors: { spaceId: UUID; buildingId: UUID; buildingName?: string };
  Units: { spaceId: UUID; buildingId: UUID; buildingName?: string };
  AccommodationFloorApartments: {
    spaceId: UUID;
    buildingId: UUID;
    buildingName?: string;
    floorId: UUID;
    floorName?: string;
  };
  AccommodationRooms: {
    spaceId: UUID;
    buildingId: UUID;
    buildingName?: string;
    parentType: 'floor' | 'unit';
    parentId: UUID;
    parentName?: string;
    parentRoomCount?: number;
    parentBedCount?: number;
  };
  AccommodationBeds: {
    spaceId: UUID;
    buildingId: UUID;
    roomId: UUID;
    roomName: string;
    buildingName?: string;
    parentName?: string;
    parentType?: 'floor' | 'unit';
    floorId?: UUID;
    unitId?: UUID;
  };
  BuildingDetail: { spaceId: UUID; buildingId: UUID };
  FloorDetail: {
    spaceId: UUID;
    buildingId: UUID;
    floorId: UUID;
    buildingName?: string;
  };
  UnitDetail: {
    spaceId: UUID;
    buildingId: UUID;
    unitId: UUID;
    buildingName?: string;
  };
  RoomDetail: {
    spaceId: UUID;
    buildingId: UUID;
    roomId: UUID;
    floorId?: UUID;
    unitId?: UUID;
  };
  BedDetail: {
    spaceId: UUID;
    buildingId: UUID;
    roomId: UUID;
    bedId: UUID;
    buildingName?: string;
    parentName?: string;
    parentType?: 'floor' | 'unit';
    floorId?: UUID;
    unitId?: UUID;
    roomName?: string;
    bedLabel?: string;
  };
  BuildingForm: { spaceId: UUID; mode: AccommodationFormMode; buildingId?: UUID };
  FloorForm: {
    spaceId: UUID;
    buildingId: UUID;
    mode: AccommodationFormMode;
    floorId?: UUID;
  };
  UnitForm: {
    spaceId: UUID;
    buildingId: UUID;
    mode: AccommodationFormMode;
    unitId?: UUID;
    floorId?: UUID;
  };
  RoomForm: {
    spaceId: UUID;
    buildingId: UUID;
    parentType: 'floor' | 'unit';
    parentId: UUID;
    mode: AccommodationFormMode;
    roomId?: UUID;
  };
  BedForm: {
    spaceId: UUID;
    buildingId: UUID;
    roomId: UUID;
    mode: AccommodationFormMode;
    bedId?: UUID;
  };
  QuickSetupWizard: { spaceId: UUID };
  AccommodationBuilder: { spaceId: UUID; buildingId: UUID };
  OccupancyWizard: {
    spaceId: UUID;
    mode: 'ALLOCATE' | 'RESERVE' | 'MOVE_IN' | 'TRANSFER' | 'VACATE';
    memberId?: UUID;
    bedId?: UUID;
    roomId?: UUID;
    unitId?: UUID;
    buildingId?: UUID;
    occupancyId?: UUID;
  };
  DailyMenuToday: { spaceId: UUID; menuDate?: string };
  DailyMenuEdit: {
    spaceId: UUID;
    menuDate: string;
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  };
  DailyMenuSelectCombo: {
    spaceId: UUID;
    menuDate: string;
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  };
  SelectMenuHub: {
    spaceId: UUID;
    menuDate: string;
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  };
  MealComboForm: { spaceId: UUID; mode: 'create' | 'edit'; comboId?: UUID };
  MenuLibrary: { spaceId: UUID; initialTab?: 'items' | 'combos' | 'extras' };
  MenuPlanning: {
    spaceId: UUID;
    menuDate?: string;
    /** When set, Menu Planning opens with this meal selected. */
    mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  };
  MealDeliveryLocations: { spaceId: UUID };
  MenuSharePreview: {
    spaceId: UUID;
    menuDate: string;
    mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  };
  MealPollResponse: {
    spaceId: UUID;
    menuDate: string;
  };
  SubscriptionPlans: { spaceId: UUID };
  CustomerSubscriptionPlans: { spaceId: UUID; memberId: UUID };
  SubscriptionActivationRequests: { spaceId: UUID };
  DashboardPendingActions: { spaceId: UUID };
  DashboardSpaceHealth: { spaceId: UUID };
  DashboardOccupancyList: {
    spaceId: UUID;
    mode: 'active' | 'moveInsThisMonth';
  };
  DashboardBedInventory: {
    spaceId: UUID;
    status: 'AVAILABLE' | 'OCCUPIED';
  };
  MemberPayments: {
    spaceId: UUID;
    memberId: UUID;
    memberName: string;
    /** Optional billing month (YYYY-MM) when opened from Owner Payments. */
    month?: string;
  };
  PaymentDetail: {
    spaceId: UUID;
    paymentId: UUID;
    memberId?: UUID;
    memberName?: string;
  };
  DayMealPaymentDetail: {
    spaceId: UUID;
    memberId: UUID;
    date: string;
    memberName?: string;
  };
  DayMealBulkPay: {
    spaceId: UUID;
    memberId: UUID;
    dates: string[];
    totalAmount: number;
    currencyCode: string;
    memberName?: string;
  };
  PaymentReview: { spaceId: UUID };
  PaymentHistory: { spaceId: UUID; paymentId: UUID };
  SpaceNotifications: { spaceId: UUID };
  RaiseComplaint: { spaceId: UUID };
  ComplaintDetail: { spaceId: UUID; complaintId: UUID };
  GlobalAttentionList: undefined;
  GlobalActivityList: undefined;
  InventoryDashboard: {
    spaceId: UUID;
    stockFilter?: 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK' | 'HEALTHY' | 'ALL' | 'ATTENTION';
  };
  InventoryItems: {
    spaceId: UUID;
    stockFilter?: 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK' | 'HEALTHY' | 'ALL' | 'ATTENTION';
  };
  InventoryItemDetails: { spaceId: UUID; itemId: UUID };
  InventoryItemForm: { spaceId: UUID; mode: 'create' | 'edit'; itemId?: UUID };
};

export type RootStackParamList = {
  Bootstrap: undefined;
  Auth: undefined;
  Main: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList, MainStackParamList {}
  }
}
