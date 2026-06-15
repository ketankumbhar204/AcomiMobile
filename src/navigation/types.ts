import type { UUID } from '../api/types';

export type AuthStackParamList = {
  Login: undefined;
  OtpVerification: {
    mobileNumber: string;
  };
};

export type SpaceTabParamList = {
  Dashboard: { spaceId: UUID };
  Members: { spaceId: UUID };
  Accommodation: { spaceId: UUID };
  Meals: { spaceId: UUID };
  Payments: { spaceId: UUID };
  Complaints: { spaceId: UUID };
};

export type AccommodationFormMode = 'create' | 'edit';

export type MainStackParamList = {
  MySpaces: undefined;
  AcceptInvitations: undefined;
  Profile: undefined;
  CreateSpace: undefined;
  SpaceDetails: { spaceId: UUID };
  EditSpace: { spaceId: UUID };
  SpaceTabs: { spaceId: UUID };
  InviteMembers: { spaceId: UUID };
  AddMember: { spaceId: UUID };
  MemberDetails: { spaceId: UUID; memberId: UUID };
  MemberOccupancyHistory: { spaceId: UUID; memberId: UUID; memberName: string };
  EditMember: { spaceId: UUID; memberId: UUID };
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
  DailyMenuToday: { spaceId: UUID };
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
  DailyMenuSelectItems: {
    spaceId: UUID;
    menuDate: string;
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  };
  MealComboForm: { spaceId: UUID; mode: 'create' | 'edit'; comboId?: UUID };
  MenuLibrary: { spaceId: UUID };
  MenuPlanning: { spaceId: UUID; menuDate?: string };
  MenuSharePreview: {
    spaceId: UUID;
    menuDate: string;
    mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  };
  MealPollResponse: {
    spaceId: UUID;
    menuDate: string;
  };
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
