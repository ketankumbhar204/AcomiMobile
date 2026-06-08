import type { NavigatorScreenParams } from '@react-navigation/native';
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
  SpaceTabs: NavigatorScreenParams<SpaceTabParamList> & { spaceId: UUID };
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
