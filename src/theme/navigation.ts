import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { colors } from './colors';
import { typography } from './typography';

export const stackHeaderOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.primary,
  headerTitleStyle: {
    ...typography.h3,
    fontSize: 17,
  },
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

export const tabHeaderOptions = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.primary,
  headerTitleStyle: {
    ...typography.h3,
    fontSize: 17,
  },
  headerShadowVisible: false,
};

export const tabBarOptions = {
  tabBarStyle: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    minHeight: 64,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textSecondary,
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  tabBarItemStyle: {
    minHeight: 48,
    paddingVertical: 2,
  },
  tabBarHideOnKeyboard: true,
};
