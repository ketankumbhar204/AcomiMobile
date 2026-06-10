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
  Rooms: { spaceId: UUID };
  Meals: { spaceId: UUID };
  Payments: { spaceId: UUID };
  Complaints: { spaceId: UUID };
};

export type MainStackParamList = {
  MySpaces: undefined;
  Profile: undefined;
  CreateSpace: undefined;
  SpaceTabs: { spaceId: UUID };
  InviteMembers: { spaceId: UUID };
};

export type RootStackParamList = {
  Bootstrap: undefined;
  Auth: undefined;
  Main: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
